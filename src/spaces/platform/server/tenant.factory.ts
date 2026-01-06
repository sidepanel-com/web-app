import { SupabaseClient } from "@supabase/supabase-js";
import { TenantService } from "./tenant.service";
import { PermissionContext } from "./base-entity.service";
import { Tables } from "@/types/database.types";
import { db } from "./db";

type UserRole = Tables<"tenant_users">["role"];

export function createTenantService(
  userId: string,
  tenantId?: string,
  userRole?: UserRole
): TenantService {
  const permissionContext: PermissionContext = {
    userId,
    tenantId,
    userRole,
  };
  return new TenantService(db, permissionContext);
}
