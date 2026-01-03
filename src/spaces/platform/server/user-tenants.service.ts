import { SupabaseClient } from "@supabase/supabase-js";
import { Tables } from "@/types/database.types";
import { generateSlug } from "@/lib/utils/slug";

type Tenant = Tables<"tenants">;
type UserRole = Tables<"tenant_users">["role"];

// Service for user-level tenant operations (listing user's tenants, creating new tenants)
export class UserTenantsService {
  private dangerSupabaseAdmin: SupabaseClient;
  private userId: string;

  constructor(dangerSupabaseAdmin: SupabaseClient, userId: string) {
    this.dangerSupabaseAdmin = dangerSupabaseAdmin;
    this.userId = userId;
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
      .eq("tenant_users.user_id", this.userId);

    if (error) throw error;
    return data.map((tenant) => ({
      ...tenant,
      tenant_users: undefined,
    }));
  }

  /**
   * Create a new tenant with the current user as owner
   */
  async createTenant(data: Pick<Tenant, "name">): Promise<Tenant> {
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
            user_id: this.userId,
            role: "owner",
          },
        ])
        .select()
        .single();

    if (tenantUserError) throw tenantUserError;

    return tenant;
  }

  /**
   * Get user's role in a specific tenant
   */
  async getUserRoleInTenant(tenantId: string): Promise<UserRole | null> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", this.userId)
      .eq("status", "active")
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data?.role || null;
  }

  /**
   * Check if user has access to a specific tenant
   */
  async hasAccessToTenant(tenantId: string): Promise<boolean> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", this.userId)
      .eq("status", "active")
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  }

  /**
   * Get tenant by slug (with access check)
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    // Check if user has access to this tenant
    if (data && !(await this.hasAccessToTenant(data.id))) {
      return null;
    }

    return data;
  }

  // Static utility methods
  static async isSlugAvailable(
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

  static async generateUniqueSlug(
    dangerSupabaseAdmin: SupabaseClient,
    name: string
  ): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (!(await this.isSlugAvailable(dangerSupabaseAdmin, slug))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
