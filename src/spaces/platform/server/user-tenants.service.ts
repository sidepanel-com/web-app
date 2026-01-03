import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { tenants, tenantUsers, userProfiles } from "../../../../db/platform/schema";
import { generateSlug } from "./utils";
import { InferSelectModel } from "drizzle-orm";

type Tenant = InferSelectModel<typeof tenants>;
type UserRole = InferSelectModel<typeof tenantUsers>["role"];

// Service for user-level tenant operations (listing user's tenants, creating new tenants)
export class UserTenantsService {
  private db: typeof db;
  private userId: string;

  constructor(drizzleClient: typeof db, userId: string) {
    this.db = drizzleClient;
    this.userId = userId;
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
          eq(userProfiles.userId, this.userId),
          eq(tenantUsers.status, "active")
        )
      );

    return result;
  }

  /**
   * Create a new tenant with the current user as owner
   */
  async createTenant(data: Pick<Tenant, "name">): Promise<Tenant> {
    const tenantSlug = generateSlug(8);

    // 1. Get User Profile ID
    const [userProfile] = await this.db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, this.userId));

    if (!userProfile) {
      throw new Error("User profile not found. Cannot create tenant.");
    }

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
      // If we fail to add the user, we should ideally delete the tenant to avoid orphans,
      // but without transactions this is best effort.
      // Ideally this whole method should be in a transaction.
      console.error("Failed to add user to tenant, cleaning up tenant", e);
      await this.db.delete(tenants).where(eq(tenants.id, tenant.id));
      throw e;
    }

    return tenant;
  }

  /**
   * Get user's role in a specific tenant
   */
  async getUserRoleInTenant(tenantId: string): Promise<UserRole | null> {
    const [result] = await this.db
      .select({ role: tenantUsers.role })
      .from(tenantUsers)
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(
        and(
          eq(tenantUsers.tenantId, tenantId),
          eq(userProfiles.userId, this.userId),
          eq(tenantUsers.status, "active")
        )
      );

    return result?.role || null;
  }

  /**
   * Check if user has access to a specific tenant
   */
  async hasAccessToTenant(tenantId: string): Promise<boolean> {
    const [result] = await this.db
      .select({ id: tenantUsers.id })
      .from(tenantUsers)
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(
        and(
          eq(tenantUsers.tenantId, tenantId),
          eq(userProfiles.userId, this.userId),
          eq(tenantUsers.status, "active")
        )
      )
      .limit(1);

    return !!result;
  }

  /**
   * Get tenant by slug (with access check)
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug));

    if (!tenant) return null;

    // Check if user has access to this tenant
    const hasAccess = await this.hasAccessToTenant(tenant.id);
    if (!hasAccess) {
      return null;
    }

    return tenant;
  }

  // Static utility methods
  static async isSlugAvailable(
    drizzleClient: typeof db,
    slug: string
  ): Promise<boolean> {
    const [result] = await drizzleClient
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    return !result;
  }

  static async generateUniqueSlug(
    drizzleClient: typeof db,
    name: string
  ): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (!(await this.isSlugAvailable(drizzleClient, slug))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
