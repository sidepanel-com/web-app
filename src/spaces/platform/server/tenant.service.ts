import { eq, and } from "drizzle-orm";
// import { SupabaseClient } from "@supabase/supabase-js"; // Removed
import { db } from "./db";
import { tenants, tenantUsers, userProfiles } from "../../../../db/platform/schema";
import { generateSlug } from "@/spaces/platform/server/utils";
import { BaseEntityService, PermissionContext } from "./base-entity.service";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

// Type definitions based on Drizzle Schema
type Tenant = InferSelectModel<typeof tenants>;
type TenantUser = InferSelectModel<typeof tenantUsers>;
type TenantUserInsert = InferInsertModel<typeof tenantUsers>;
type UserRole = TenantUser["role"];
type TenantUpdate = Partial<Tenant>; // Approximate

// Composite type for GetTenantWithUsers
type TenantWithUsers = Tenant & {
  tenant_users: (TenantUser & {
    user_profiles: InferSelectModel<typeof userProfiles>;
  })[];
};

export class TenantService extends BaseEntityService {
  constructor(
    drizzleClient: typeof db,
    permissionContext: PermissionContext
  ) {
    super(drizzleClient, permissionContext);
  }

  // Permission checks for tenant operations
  async canRead(tenantId?: string): Promise<boolean> {
    if (!tenantId) return true; // Can read list of own tenants
    return await this.hasAccessToTenant(tenantId);
  }

  async canCreate(): Promise<boolean> {
    // Anyone can create a tenant (they become the owner)
    return true;
  }

  async canUpdate(tenantId: string): Promise<boolean> {
    return (
      (await this.hasPermission("update_tenant", tenantId)) &&
      (await this.isOwnerCheck(tenantId))
    );
  }

  async canDelete(tenantId: string): Promise<boolean> {
    return (
      (await this.hasPermission("delete_tenant", tenantId)) &&
      (await this.isOwnerCheck(tenantId))
    );
  }

  // Core tenant operations
  async isOwnerCheck(tenantId: string): Promise<boolean> {
    const [result] = await this.db
      .select({ role: tenantUsers.role })
      .from(tenantUsers)
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(
        and(
          eq(tenantUsers.tenantId, tenantId),
          eq(userProfiles.userId, this.permissionContext.userId),
          eq(tenantUsers.status, "active"),
          eq(tenantUsers.role, "owner")
        )
      );

    return !!result;
  }

  /**
   * Create a new tenant with the current user as owner
   */
  async createTenantWithOwner(data: Pick<Tenant, "name">): Promise<Tenant> {
    if (!(await this.canCreate())) {
      throw new Error("Insufficient permissions to create tenant");
    }

    // 1. Get User Profile ID
    const [userProfile] = await this.db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, this.permissionContext.userId));

    if (!userProfile) {
      throw new Error("User profile not found. Cannot create tenant.");
    }

    const tenantSlug = generateSlug(8);

    // 2. Create Tenant
    const [tenant] = await this.db
      .insert(tenants)
      .values({
        name: data.name,
        slug: tenantSlug,
        status: "active",
      })
      .returning();

    if (!tenant) throw new Error("Failed to create tenant");

    // 3. Add User as Owner
    try {
      await this.db.insert(tenantUsers).values({
        tenantId: tenant.id,
        profileId: userProfile.id,
        role: "owner",
      });
    } catch (e) {
      console.error("Failed to add user to tenant, cleaning up tenant", e);
      await this.db.delete(tenants).where(eq(tenants.id, tenant.id));
      throw e;
    }
    
    // Debug log compatible with previous implementation
    console.log("Tenant created with owner", { tenantId: tenant.id, profileId: userProfile.id });

    return tenant;
  }

  /**
   * Get tenant by ID with user access check
   */
  async getTenantById(tenantId: string): Promise<Tenant | null> {
    if (!(await this.canRead(tenantId))) {
      throw new Error("Insufficient permissions to read tenant");
    }

    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    return tenant || null;
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug));

    if (!tenant) return null;

    // Check if user has access to this tenant
    // NOTE: This logic mimics original service which allowed fetching by slug but checked access
    if (tenant && !(await this.canRead(tenant.id))) {
      return null;
    }

    return tenant;
  }

  /**
   * Get all tenants for the current user
   */
  async getUserTenants(): Promise<Tenant[]> {
    const result = await this.db
      .select({
         id: tenants.id,
         slug: tenants.slug,
         name: tenants.name,
         status: tenants.status,
         subscriptionTier: tenants.subscriptionTier,
         createdAt: tenants.createdAt,
         updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .innerJoin(tenantUsers, eq(tenants.id, tenantUsers.tenantId))
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(
        and(
          eq(userProfiles.userId, this.permissionContext.userId),
          eq(tenantUsers.status, "active")
        )
      );

    return result;
  }

  /**
   * Update tenant (permission-checked)
   */
  async updateTenant(tenantId: string, updates: TenantUpdate): Promise<Tenant> {
    if (!(await this.canUpdate(tenantId))) {
      throw new Error("Insufficient permissions to update tenant");
    }

    const [updated] = await this.db
      .update(tenants)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(), // Drizzle usually handles updatedAt on DB side if configured, but safe to set
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    return updated;
  }

  /**
   * Get tenant with all users
   */
  async getTenantWithUsers(tenantId: string): Promise<TenantWithUsers | null> {
    if (!(await this.canRead(tenantId))) {
      throw new Error("Insufficient permissions to read tenant users");
    }

    // Use manual join since relations are not fully typed/verified
    const [tenantData] = await this.db.select().from(tenants).where(eq(tenants.id, tenantId));
    if (!tenantData) return null;

    const users = await this.db
      .select({
        tenantUser: tenantUsers,
        userProfile: userProfiles,
      })
      .from(tenantUsers)
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(eq(tenantUsers.tenantId, tenantId));

    // Transform to expected shape
    const formattedUsers = users.map(u => ({
        ...u.tenantUser,
        user_profiles: u.userProfile
    }));

    return {
        ...tenantData,
        tenant_users: formattedUsers
    };
  }

  /**
   * Check if user has access to tenant
   */
  async hasAccessToTenant(tenantId: string): Promise<boolean> {
    const [result] = await this.db
      .select({ id: tenantUsers.id })
      .from(tenantUsers)
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(
        and(
          eq(tenantUsers.tenantId, tenantId),
          eq(userProfiles.userId, this.permissionContext.userId),
          eq(tenantUsers.status, "active")
        )
      )
      .limit(1);

    return !!result;
  }

  /**
   * Get user's role in tenant
   */
  async getUserRoleInTenant(tenantId: string): Promise<UserRole | null> {
    const [result] = await this.db
      .select({ role: tenantUsers.role })
      .from(tenantUsers)
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(
        and(
          eq(tenantUsers.tenantId, tenantId),
          eq(userProfiles.userId, this.permissionContext.userId),
          eq(tenantUsers.status, "active")
        )
      );

    return result?.role || null;
  }

  /**
   * Add user to tenant (admin+ only)
   */
  async addUserToTenant(
    data: Omit<TenantUserInsert, "id" | "createdAt" | "updatedAt">
  ): Promise<TenantUser> {
    if (!(await this.hasPermission("manage_users", data.tenantId))) {
      throw new Error("Insufficient permissions to add users to tenant");
    }

    // Drizzle insert
    const [result] = await this.db
      .insert(tenantUsers)
      .values(data as TenantUserInsert) // Type cast if Omit mismatch, but should be fine
      .returning();

    return result;
  }

  /**
   * Update user role in tenant (admin+ only)
   */
  async updateUserRole(
    tenantUserId: string,
    role: UserRole
  ): Promise<TenantUser> {
    // First get the tenant_id for permission check
    const [tenantUser] =
      await this.db
        .select({ tenantId: tenantUsers.tenantId })
        .from(tenantUsers)
        .where(eq(tenantUsers.id, tenantUserId));

    if (!tenantUser) throw new Error("Tenant user not found");

    if (!(await this.hasPermission("manage_users", tenantUser.tenantId))) {
      throw new Error("Insufficient permissions to update user roles");
    }

    const [updated] = await this.db
      .update(tenantUsers)
      .set({ role })
      .where(eq(tenantUsers.id, tenantUserId))
      .returning();

    return updated;
  }

  /**
   * Remove user from tenant (admin+ only)
   */
  async removeUserFromTenant(tenantUserId: string): Promise<void> {
    // First get the tenant_id for permission check
    const [tenantUser] =
      await this.db
        .select({ tenantId: tenantUsers.tenantId })
        .from(tenantUsers)
        .where(eq(tenantUsers.id, tenantUserId));

    if (!tenantUser) throw new Error("Tenant user not found");

    if (!(await this.hasPermission("manage_users", tenantUser.tenantId))) {
      throw new Error("Insufficient permissions to remove users from tenant");
    }

    await this.db.delete(tenantUsers).where(eq(tenantUsers.id, tenantUserId));
  }

  /**
   * Get tenant users with profiles
   */
  async getTenantUsers(
    tenantId: string
  ): Promise<(TenantUser & { user_profiles: InferSelectModel<typeof userProfiles> })[]> {
    if (!(await this.hasPermission("read_users", tenantId))) {
      throw new Error("Insufficient permissions to read tenant users");
    }

    const users = await this.db
      .select({
        tenantUser: tenantUsers,
        userProfile: userProfiles,
      })
      .from(tenantUsers)
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(
        and(
            eq(tenantUsers.tenantId, tenantId),
            eq(tenantUsers.status, "active")
        )
      );

    return users.map(u => ({
        ...u.tenantUser,
        user_profiles: u.userProfile
    }));
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const [data] = await this.db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    return !data;
  }

  /**
   * Generate unique slug from name
   */
  async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (!(await this.isSlugAvailable(slug))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Delete tenant (owners only)
   */
  async deleteTenant(tenantId: string): Promise<void> {
    if (!(await this.canDelete(tenantId))) {
      throw new Error("Insufficient permissions to delete tenant");
    }

    await this.db.delete(tenants).where(eq(tenants.id, tenantId));
  }

  // Static factory method for backward compatibility and easy instantiation
  static create(
    drizzleClient: typeof db,
    userId: string,
    tenantId?: string,
    userRole?: UserRole
  ): TenantService {
    return new TenantService(drizzleClient, {
      userId,
      tenantId, // Warning: This might be treated as string | undefined
      userRole,
    });
  }

  // Static methods for system-level operations (no user context needed)
  static async isSlugAvailableStatic(
    drizzleClient: typeof db,
    slug: string
  ): Promise<boolean> {
    const [data] = await drizzleClient
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    return !data;
  }
}
