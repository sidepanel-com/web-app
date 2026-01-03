import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { TenantUserService } from "@/spaces/platform/server/tenant-user.service";
import { TenantUserInvitationService } from "@/spaces/platform/server/tenant-user-invitation.service";
import { TenantService } from "@/spaces/platform/server/tenant.service";

const schemas = {
  GET: z.object({}),
  POST: z.object({
    email: z.string().email(),
    role: z.enum(["owner", "admin", "member", "viewer"]),
    message: z.string().optional(),
  }),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  // List all users in the tenant
  GET: async ({ db, apiUser, tenantId }) => {
    // Get user's role in this tenant first
    const tempTenantService = TenantService.create(
      db,
      apiUser.id,
      tenantId
    );
    const userRole = await tempTenantService.getUserRoleInTenant(tenantId);

    // Create tenant user service with full context
    const tenantUserService = TenantUserService.create(
      db,
      apiUser.id,
      tenantId,
      userRole || "viewer"
    );

    // Get users list and stats
    const [users, stats] = await Promise.all([
      tenantUserService.listTenantUsers(),
      tenantUserService.getUserStats(),
    ]);

    return {
      users,
      stats,
    };
  },

  // Invite a new user to the tenant
  POST: async ({ db, requestData, apiUser, tenantId }) => {
    // Get user's role in this tenant first
    const tempTenantService = TenantService.create(
      db,
      apiUser.id,
      tenantId
    );
    const userRole = await tempTenantService.getUserRoleInTenant(tenantId);

    // Create invitation service with full context
    const invitationService = TenantUserInvitationService.create(
      db,
      apiUser.id,
      tenantId,
      userRole || "viewer"
    );

    // Send invitation
    const invitation = await invitationService.sendInvitation({
      email: requestData.email,
      role: requestData.role,
      message: requestData.message,
    });

    return {
      invitation,
      message: `Invitation sent to ${requestData.email}`,
    };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
