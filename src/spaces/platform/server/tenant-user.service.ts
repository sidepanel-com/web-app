import { SupabaseClient } from "@supabase/supabase-js";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { BaseEntityService, PermissionContext } from "./base-entity.service";

type TenantUser = Tables<"tenant_users">;
type UserProfile = Tables<"user_profiles">;
type UserRole = Tables<"tenant_users">["role"];
type UserStatus = Tables<"tenant_users">["status"];

export interface TenantUserWithProfile extends TenantUser {
  user_profiles: UserProfile | null;
}

export interface TenantUserListItem {
  id: string;
  user_id: string;
  role: UserRole;
  status: UserStatus | null;
  joined_at: string | null;
  invited_by: string | null;
  permissions: any;
  email?: string; // From auth.users if needed
}

export class TenantUserService extends BaseEntityService {
  constructor(
    dangerSupabaseAdmin: SupabaseClient,
    permissionContext: PermissionContext
  ) {
    super(dangerSupabaseAdmin, permissionContext);
  }

  // Permission checks
  async canRead(): Promise<boolean> {
    return await this.hasPermission("read_tenant_users");
  }

  async canCreate(): Promise<boolean> {
    return await this.hasPermission("invite_users");
  }

  async canUpdate(entityId: string): Promise<boolean> {
    // Can update if user has manage_users permission
    // Or if updating their own profile (limited fields)
    const canManage = await this.hasPermission("manage_users");
    if (canManage) return true;

    // Check if updating own record (limited updates allowed)
    const tenantUser = await this.findById(entityId);
    return tenantUser?.user_id === this.permissionContext.userId;
  }

  async canDelete(entityId: string): Promise<boolean> {
    // Only owners and admins can remove users
    // Cannot remove yourself if you're the only owner
    const canRemove = await this.hasPermission("remove_users");
    if (!canRemove) return false;

    const tenantUser = await this.findById(entityId);
    if (!tenantUser) return false;

    // Cannot remove yourself
    if (tenantUser.user_id === this.permissionContext.userId) {
      return false;
    }

    // If removing an owner, ensure there's at least one other owner
    if (tenantUser.role === "owner") {
      const ownerCount = await this.countOwners();
      return ownerCount > 1;
    }

    return true;
  }

  /**
   * List all users in the tenant with their profiles
   */
  async listTenantUsers(): Promise<TenantUserListItem[]> {
    if (!(await this.canRead())) {
      throw new Error("Insufficient permissions to list tenant users");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select(
        `
        id,
        user_id,
        role,
        status,
        joined_at,
        invited_by,
        permissions
      `
      )
      .eq("tenant_id", this.permissionContext.tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get email addresses for each user using Admin API
    const userIds = data?.map((user) => user.user_id) || [];
    const emailMap = new Map<string, string | null>();

    // Fetch user emails using Admin API
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const { data: authUser } =
            await this.dangerSupabaseAdmin.auth.admin.getUserById(userId);
          emailMap.set(userId, authUser.user?.email || null);
        } catch (err) {
          console.error(`Error fetching user ${userId}:`, err);
          emailMap.set(userId, null);
        }
      })
    );

    return (data || []).map(
      (user: any) =>
        ({
          id: user.id,
          user_id: user.user_id,
          role: user.role,
          status: user.status,
          joined_at: user.joined_at,
          invited_by: user.invited_by,
          permissions: user.permissions,
          email: emailMap.get(user.user_id) || null,
        } as TenantUserListItem)
    );
  }

  /**
   * Get a specific tenant user by ID
   */
  async findById(id: string): Promise<TenantUser | null> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", this.permissionContext.tenantId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  /**
   * Get a tenant user by user_id
   */
  async findByUserId(userId: string): Promise<TenantUser | null> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select("*")
      .eq("user_id", userId)
      .eq("tenant_id", this.permissionContext.tenantId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  /**
   * Update a tenant user's role
   */
  async updateUserRole(
    tenantUserId: string,
    newRole: UserRole
  ): Promise<TenantUser> {
    if (!(await this.canUpdate(tenantUserId))) {
      throw new Error("Insufficient permissions to update user role");
    }

    const tenantUser = await this.findById(tenantUserId);
    if (!tenantUser) {
      throw new Error("Tenant user not found");
    }

    // Prevent role changes that would leave no owners
    if (tenantUser.role === "owner" && newRole !== "owner") {
      const ownerCount = await this.countOwners();
      if (ownerCount <= 1) {
        throw new Error(
          "Cannot change role: tenant must have at least one owner"
        );
      }
    }

    // Only owners can promote to owner
    if (newRole === "owner" && this.permissionContext.userRole !== "owner") {
      throw new Error("Only owners can promote users to owner role");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantUserId)
      .eq("tenant_id", this.permissionContext.tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a tenant user's status
   */
  async updateUserStatus(
    tenantUserId: string,
    status: UserStatus
  ): Promise<TenantUser> {
    if (!(await this.canUpdate(tenantUserId))) {
      throw new Error("Insufficient permissions to update user status");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantUserId)
      .eq("tenant_id", this.permissionContext.tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a tenant user's custom permissions
   */
  async updateUserPermissions(
    tenantUserId: string,
    permissions: Record<string, any>
  ): Promise<TenantUser> {
    if (!(await this.canUpdate(tenantUserId))) {
      throw new Error("Insufficient permissions to update user permissions");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .update({
        permissions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantUserId)
      .eq("tenant_id", this.permissionContext.tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove a user from the tenant
   */
  async removeUser(tenantUserId: string): Promise<void> {
    if (!(await this.canDelete(tenantUserId))) {
      throw new Error("Insufficient permissions to remove user");
    }

    const { error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .delete()
      .eq("id", tenantUserId)
      .eq("tenant_id", this.permissionContext.tenantId);

    if (error) throw error;
  }

  /**
   * Count the number of owners in the tenant
   */
  private async countOwners(): Promise<number> {
    const { count, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", this.permissionContext.tenantId)
      .eq("role", "owner");

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get user statistics for the tenant
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    byRole: Record<UserRole, number>;
  }> {
    if (!(await this.canRead())) {
      throw new Error("Insufficient permissions to view user statistics");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select("role, status")
      .eq("tenant_id", this.permissionContext.tenantId);

    if (error) throw error;

    const stats = {
      total: data.length,
      active: 0,
      pending: 0,
      byRole: {
        owner: 0,
        admin: 0,
        member: 0,
        viewer: 0,
      } as Record<UserRole, number>,
    };

    data.forEach((user) => {
      // Count by status
      if (user.status === "active") stats.active++;
      if (user.status === "pending") stats.pending++;

      // Count by role
      stats.byRole[user.role as UserRole]++;
    });

    return stats;
  }

  // Static factory method
  static create(
    dangerSupabaseAdmin: SupabaseClient,
    userId: string,
    tenantId: string,
    userRole: UserRole
  ): TenantUserService {
    return new TenantUserService(dangerSupabaseAdmin, {
      userId,
      tenantId,
      userRole,
    });
  }
}
