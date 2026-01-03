import { DrizzleClient } from "./db";
import { Tables } from "@/types/database.types";

type UserRole = Tables<"tenant_users">["role"];

// Permission context for dynamic CRUD operations
export interface PermissionContext {
  userId: string;
  tenantId?: string;
  userRole?: UserRole;
  customPermissions?: Record<string, any>;
}

// Base service class that all entity services will extend
export abstract class BaseEntityService {
  protected db: DrizzleClient;
  protected permissionContext: PermissionContext;

  constructor(
    db: DrizzleClient,
    permissionContext: PermissionContext
  ) {
    this.db = db;
    this.permissionContext = permissionContext;
  }

  // Abstract methods that child services must implement
  abstract canRead(entityId?: string): Promise<boolean>;
  abstract canCreate(): Promise<boolean>;
  abstract canUpdate(entityId: string): Promise<boolean>;
  abstract canDelete(entityId: string): Promise<boolean>;

  // Helper method to check if user has specific permission
  protected async hasPermission(
    permission: string,
    entityId?: string
  ): Promise<boolean> {
    // This will be expanded to check custom tenant-defined permissions
    // For now, we'll use the basic role-based system
    const { userRole, customPermissions } = this.permissionContext;

    // Check custom permissions first (tenant-defined)
    if (customPermissions && customPermissions[permission]) {
      return customPermissions[permission];
    }

    // Fallback to role-based permissions
    switch (userRole) {
      case "owner":
        return true;
      case "admin":
        return !["delete_tenant", "transfer_ownership"].includes(permission);
      case "member":
        return ["read", "create", "update_own"].includes(permission);
      case "viewer":
        return permission === "read";
      default:
        return false;
    }
  }
}
