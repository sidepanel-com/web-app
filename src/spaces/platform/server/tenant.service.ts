import { SupabaseClient } from "@supabase/supabase-js";
import { Tables, TablesUpdate } from "@/types/database.types";
import { generateSlug } from "@/lib/utils/slug";
import { BaseEntityService, PermissionContext } from "./base-entity.service";

type UserRole = Tables<"tenant_users">["role"];

type Tenant = Tables<"tenants">;
type TenantUser = Tables<"tenant_users">;
type TenantUserInsert = Tables<"tenant_users">;
type TenantUpdate = TablesUpdate<"tenants">;
type TenantWithUsers = Tables<"tenants"> & {
  tenant_users: Tables<"tenant_users">[];
};

export class TenantService extends BaseEntityService {
  constructor(
    dangerSupabaseAdmin: SupabaseClient,
    permissionContext: PermissionContext
  ) {
    super(dangerSupabaseAdmin, permissionContext);
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
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", this.permissionContext.userId)
      .eq("status", "active")
      .eq("role", "owner")
      .single();

    if (error) throw error;
    return data?.role === "owner";
  }

  /**
   * Create a new tenant with the current user as owner
   */
  async createTenantWithOwner(data: Pick<Tenant, "name">): Promise<Tenant> {
    if (!(await this.canCreate())) {
      throw new Error("Insufficient permissions to create tenant");
    }

    const tenantSlug = generateSlug(8);

    const { data: tenant, error: tenantError } = await this.dangerSupabaseAdmin
      .from("tenants")
      .insert([
        {
          name: data.name,
          slug: tenantSlug,
        },
      ])
      .select()
      .single();

    if (tenantError) throw tenantError;

    const { data: tenantUser, error: tenantUserError } =
      await this.dangerSupabaseAdmin
        .from("tenant_users")
        .insert([
          {
            tenant_id: tenant.id,
            user_id: this.permissionContext.userId,
            role: "owner",
          },
        ])
        .select()
        .single();

    if (tenantUserError) throw tenantUserError;

    console.log(tenantUser);

    return tenant;
  }

  /**
   * Get tenant by ID with user access check
   */
  async getTenantById(tenantId: string): Promise<Tenant | null> {
    if (!(await this.canRead(tenantId))) {
      throw new Error("Insufficient permissions to read tenant");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned

    // Check if user has access to this tenant
    if (data && !(await this.canRead(data.id))) {
      return null;
    }

    return data;
  }

  /**
   * Get all tenants for the current user
   */
  async getUserTenants(): Promise<Tenant[]> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenants")
      .select(
        `
        *,
        tenant_users!inner(role, status, joined_at)
      `
      )
      .eq("tenant_users.status", "active")
      .eq("tenant_users.user_id", this.permissionContext.userId);

    if (error) throw error;
    return data.map((tenant) => ({
      ...tenant,
      tenant_users: undefined,
    }));
  }

  /**
   * Update tenant (permission-checked)
   */
  async updateTenant(tenantId: string, updates: TenantUpdate): Promise<Tenant> {
    if (!(await this.canUpdate(tenantId))) {
      throw new Error("Insufficient permissions to update tenant");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenants")
      .update(updates)
      .eq("id", tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get tenant with all users
   */
  async getTenantWithUsers(tenantId: string): Promise<TenantWithUsers | null> {
    if (!(await this.canRead(tenantId))) {
      throw new Error("Insufficient permissions to read tenant users");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenants")
      .select(
        `
        *,
        tenant_users(
          *,
          user_profiles(*)
        )
      `
      )
      .eq("id", tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check if user has access to tenant
   */
  async hasAccessToTenant(tenantId: string): Promise<boolean> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", this.permissionContext.userId)
      .eq("status", "active")
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  }

  /**
   * Get user's role in tenant
   */
  async getUserRoleInTenant(tenantId: string): Promise<UserRole | null> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", this.permissionContext.userId)
      .eq("status", "active")
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data?.role || null;
  }

  /**
   * Add user to tenant (admin+ only)
   */
  async addUserToTenant(
    data: Omit<TenantUserInsert, "id" | "created_at" | "updated_at">
  ): Promise<TenantUser> {
    if (!(await this.hasPermission("manage_users", data.tenant_id))) {
      throw new Error("Insufficient permissions to add users to tenant");
    }

    const { data: result, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .insert({
        ...data,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
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
    const { data: tenantUser, error: fetchError } =
      await this.dangerSupabaseAdmin
        .from("tenant_users")
        .select("tenant_id")
        .eq("id", tenantUserId)
        .single();

    if (fetchError) throw fetchError;

    if (!(await this.hasPermission("manage_users", tenantUser.tenant_id))) {
      throw new Error("Insufficient permissions to update user roles");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .update({ role })
      .eq("id", tenantUserId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove user from tenant (admin+ only)
   */
  async removeUserFromTenant(tenantUserId: string): Promise<void> {
    // First get the tenant_id for permission check
    const { data: tenantUser, error: fetchError } =
      await this.dangerSupabaseAdmin
        .from("tenant_users")
        .select("tenant_id")
        .eq("id", tenantUserId)
        .single();

    if (fetchError) throw fetchError;

    if (!(await this.hasPermission("manage_users", tenantUser.tenant_id))) {
      throw new Error("Insufficient permissions to remove users from tenant");
    }

    const { error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .delete()
      .eq("id", tenantUserId);

    if (error) throw error;
  }

  /**
   * Get tenant users with profiles
   */
  async getTenantUsers(
    tenantId: string
  ): Promise<(TenantUser & { user_profiles: any })[]> {
    if (!(await this.hasPermission("read_users", tenantId))) {
      throw new Error("Insufficient permissions to read tenant users");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select(
        `
        *,
        user_profiles(*)
      `
      )
      .eq("tenant_id", tenantId)
      .eq("status", "active");

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .limit(1);

    if (error) throw error;
    return !data || data.length === 0;
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

    const { error } = await this.dangerSupabaseAdmin
      .from("tenants")
      .delete()
      .eq("id", tenantId);

    if (error) throw error;
  }

  // Static factory method for backward compatibility and easy instantiation
  static create(
    dangerSupabaseAdmin: SupabaseClient,
    userId: string,
    tenantId?: string,
    userRole?: UserRole
  ): TenantService {
    return new TenantService(dangerSupabaseAdmin, {
      userId,
      tenantId,
      userRole,
    });
  }

  // Static methods for system-level operations (no user context needed)
  static async isSlugAvailableStatic(
    dangerSupabaseAdmin: SupabaseClient,
    slug: string
  ): Promise<boolean> {
    const { data, error } = await dangerSupabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .limit(1);

    if (error) throw error;
    return !data || data.length === 0;
  }
}
