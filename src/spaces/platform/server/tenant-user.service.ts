
import { and, desc, eq, count, sql } from "drizzle-orm";
import { InferSelectModel } from "drizzle-orm";
import { BaseEntityService, PermissionContext } from "./base-entity.service";
import {
  tenantUsers,
  userProfiles,
  tenants,
} from "@db/platform/schema";

type TenantUser = InferSelectModel<typeof tenantUsers>;
type UserProfile = InferSelectModel<typeof userProfiles>;
type UserRole = TenantUser["role"];
type UserStatus = TenantUser["status"];

export interface TenantUserWithProfile extends TenantUser {
  profile: UserProfile | null;
}

export interface TenantUserListItem {
  id: string;
  user_id: string;
  role: UserRole;
  status: UserStatus | null;
  joined_at: string | null;
  invited_by: string | null;
  invited_by_email: string | null; // Added in Drizzle schema
//   permissions: any; // Removed as not in Drizzle schema
  email?: string;
  first_name?: string | null; // From profile
  last_name?: string | null; // From profile
  avatar_url?: string | null; // From profile/auth?
}

export class TenantUserService extends BaseEntityService {
  constructor(
    db: any,
    permissionContext: PermissionContext
  ) {
    super(db, permissionContext);
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
    const canManage = await this.hasPermission("manage_users");
    if (canManage) return true;

    // Check if updating own record (limited updates allowed)
    const tenantUser = await this.findById(entityId);
    // Note: permissionContext.userId maps to userProfiles.userId, 
    // but tenantUser has profileId. We need to check relation.
    // Simplifying: if we are updating, we usually check against the caller's ID.
    // But `permissionContext.userId` IS the auth user ID.
    // tenantUser.profileId -> join userProfiles -> userId.
    
    // For now, let's defer detailed "own record" check or do a join query here.
    // Simplified:
    return false; // Strict default
  }

  async canDelete(entityId: string): Promise<boolean> {
    const canRemove = await this.hasPermission("remove_users");
    if (!canRemove) return false;

    // Cannot remove yourself ??
    // Need to resolve profileId to userId to check.
    const tenantUser = await this.findById(entityId);
    if (!tenantUser) return false;

    // Get profile for this user
    const [profile] = await this.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.id, tenantUser.profileId))
        .limit(1);

    if (profile && profile.userId === this.permissionContext.userId) {
        return false; // Cannot remove yourself
    }

    // If removing an owner, ensure at least one other owner
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

    // Join tenantUsers with userProfiles
    const results = await this.db
      .select({
        tenantUser: tenantUsers,
        profile: userProfiles,
      })
      .from(tenantUsers)
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(eq(tenantUsers.tenantId, this.permissionContext.tenantId!))
      .orderBy(desc(tenantUsers.createdAt));

    return results.map(({ tenantUser, profile }) => ({
      id: tenantUser.id,
      user_id: profile.userId,
      role: tenantUser.role,
      status: tenantUser.status,
      joined_at: tenantUser.createdAt,
      invited_by: tenantUser.invitedBy,
      invited_by_email: tenantUser.invitedByEmail,
      email: profile.email,
      first_name: profile.displayName ? profile.displayName.split(' ')[0] : null, // Heuristic
      last_name: profile.displayName ? profile.displayName.split(' ').slice(1).join(' ') : null,
      avatar_url: null, // Not in profile schema
    }));
  }

  /**
   * Get a specific tenant user by ID
   */
  async findById(id: string): Promise<TenantUser | null> {
    const [result] = await this.db
      .select()
      .from(tenantUsers)
      .where(
        and(
            eq(tenantUsers.id, id),
            eq(tenantUsers.tenantId, this.permissionContext.tenantId!)
        )
      )
      .limit(1);

    return result || null;
  }

  /**
   * Get a tenant user by user_id
   */
  async findByUserId(userId: string): Promise<TenantUser | null> {
    // Need to join userProfiles to match userId
    const [result] = await this.db
      .select({ tenantUser: tenantUsers })
      .from(tenantUsers)
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(
        and(
            eq(userProfiles.userId, userId),
            eq(tenantUsers.tenantId, this.permissionContext.tenantId!)
        )
      )
      .limit(1);

    return result?.tenantUser || null;
  }

  /**
   * Update a tenant user's role
   */
  async updateUserRole(
    tenantUserId: string,
    newRole: UserRole
  ): Promise<TenantUser> {
    // Check permissions... 
    // (Simplification: assuming `canUpdate` handles basic checks, but `owner` logic needed)
    // Re-implementing specific checks:
    const canManage = await this.hasPermission("manage_users");
    if (!canManage) throw new Error("Insufficient permissions");

    const tenantUser = await this.findById(tenantUserId);
    if (!tenantUser) throw new Error("Tenant user not found");

    // Prevent role changes that would leave no owners
    if (tenantUser.role === "owner" && newRole !== "owner") {
      const ownerCount = await this.countOwners();
      if (ownerCount <= 1) {
        throw new Error("Cannot change role: tenant must have at least one owner");
      }
    }

    // Only owners can promote to owner
    if (newRole === "owner" && this.permissionContext.userRole !== "owner") {
      throw new Error("Only owners can promote users to owner role");
    }

    const [updated] = await this.db
      .update(tenantUsers)
      .set({
        role: newRole,
        updatedAt: new Date().toISOString(), // Use provided timestamp format or let DB handle? Schema says defaultNow().$onUpdate. But we can set explicitly.
      })
      .where(
        and(
            eq(tenantUsers.id, tenantUserId),
            eq(tenantUsers.tenantId, this.permissionContext.tenantId!)
        )
      )
      .returning();

    return updated;
  }

  /**
   * Update a tenant user's status
   */
  async updateUserStatus(
    tenantUserId: string,
    status: UserStatus
  ): Promise<TenantUser> {
    const canManage = await this.hasPermission("manage_users");
    if (!canManage) throw new Error("Insufficient permissions");

    const [updated] = await this.db
      .update(tenantUsers)
      .set({
        status: status,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
            eq(tenantUsers.id, tenantUserId),
            eq(tenantUsers.tenantId, this.permissionContext.tenantId!)
        )
      )
      .returning();

    return updated;
  }

  /**
   * Update a tenant user's custom permissions
   * @deprecated Permissions column missing in Drizzle schema
   */
  async updateUserPermissions(
    tenantUserId: string,
    permissions: Record<string, any>
  ): Promise<TenantUser> {
    throw new Error("Custom permissions not currently supported");
    // Implementation would be similar to above
  }

  /**
   * Remove a user from the tenant
   */
  async removeUser(tenantUserId: string): Promise<void> {
    if (!(await this.canDelete(tenantUserId))) {
      throw new Error("Insufficient permissions to remove user");
    }

    await this.db
      .delete(tenantUsers)
      .where(
        and(
            eq(tenantUsers.id, tenantUserId),
            eq(tenantUsers.tenantId, this.permissionContext.tenantId!)
        )
      );
  }

  /**
   * Count the number of owners in the tenant
   */
  private async countOwners(): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(tenantUsers)
      .where(
        and(
            eq(tenantUsers.tenantId, this.permissionContext.tenantId!),
            eq(tenantUsers.role, "owner")
        )
      );
    
    return result?.count || 0;
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
      throw new Error("Insufficient permissions");
    }

    const users = await this.db
      .select({ role: tenantUsers.role, status: tenantUsers.status })
      .from(tenantUsers)
      .where(eq(tenantUsers.tenantId, this.permissionContext.tenantId!));

    const stats = {
      total: users.length,
      active: 0,
      pending: 0,
      byRole: {
        owner: 0,
        admin: 0,
        member: 0,
        viewer: 0,
      } as Record<UserRole, number>,
    };

    users.forEach((user) => {
        if (user.status === "active") stats.active++;
        if (user.status === "pending") stats.pending++;
        if (user.role) stats.byRole[user.role]++;
    });

    return stats;
  }

  // Static factory method
  static create(
    db: any,
    userId: string,
    tenantId: string,
    userRole: UserRole
  ): TenantUserService {
    return new TenantUserService(db, {
      userId,
      tenantId,
      userRole,
    });
  }
}
