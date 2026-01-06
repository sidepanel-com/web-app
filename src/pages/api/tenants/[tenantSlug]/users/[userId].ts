import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { TenantUserService } from "@/spaces/platform/server/tenant-user.service";
import { TenantService } from "@/spaces/platform/server/tenant.service";
import { Tables } from "@/types/database.types";
type TenantUser = Tables<"tenant_users">;

const schemas = {
  GET: z.object({
    userId: z.string(),
  }),
  PATCH: z.object({
    userId: z.string(),
    role: z.enum(["owner", "admin", "member", "viewer"]).optional(),
    status: z.enum(["active", "inactive", "pending"]).optional(),
    permissions: z.record(z.string(), z.any()).optional(),
  }),
  DELETE: z.object({
    userId: z.string(),
  }),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  // Get specific user details
  GET: async ({ db, requestData, apiUser, tenantId }) => {
    // Get user's role in this tenant first
    const tempTenantService = TenantService.create(db, apiUser.id, tenantId);
    const userRole = await tempTenantService.getUserRoleInTenant(tenantId);

    // Create tenant user service with full context
    const tenantUserService = TenantUserService.create(
      db,
      apiUser.id,
      tenantId,
      userRole || "viewer"
    );

    // Get user by tenant user ID
    const user = await tenantUserService.findById(requestData.userId);
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },

  // Update user role, status, or permissions
  PATCH: async ({ db, requestData, apiUser, tenantId }) => {
    // Get user's role in this tenant first
    const tempTenantService = TenantService.create(db, apiUser.id, tenantId);
    const userRole = await tempTenantService.getUserRoleInTenant(tenantId);

    // Create tenant user service with full context
    const tenantUserService = TenantUserService.create(
      db,
      apiUser.id,
      tenantId,
      userRole || "viewer"
    );

    let updatedUser: TenantUser | null = null;

    // Update role if provided
    if (requestData.role) {
      updatedUser = await tenantUserService.updateUserRole(
        requestData.userId,
        requestData.role
      );
    }

    // Update status if provided
    if (requestData.status) {
      updatedUser = await tenantUserService.updateUserStatus(
        requestData.userId,
        requestData.status
      );
    }

    // Update permissions if provided
    if (requestData.permissions) {
      updatedUser = await tenantUserService.updateUserPermissions(
        requestData.userId,
        requestData.permissions
      );
    }

    // If no updates were made, just return the current user
    if (!updatedUser) {
      updatedUser = await tenantUserService.findById(requestData.userId);
    }

    return {
      user: updatedUser,
      message: "User updated successfully",
    };
  },

  // Remove user from tenant
  DELETE: async ({ db, requestData, apiUser, tenantId }) => {
    // Get user's role in this tenant first
    const tempTenantService = TenantService.create(db, apiUser.id, tenantId);
    const userRole = await tempTenantService.getUserRoleInTenant(tenantId);

    // Create tenant user service with full context
    const tenantUserService = TenantUserService.create(
      db,
      apiUser.id,
      tenantId,
      userRole || "viewer"
    );

    // Remove user from tenant
    await tenantUserService.removeUser(requestData.userId);

    return {
      success: true,
      message: "User removed from tenant successfully",
    };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
