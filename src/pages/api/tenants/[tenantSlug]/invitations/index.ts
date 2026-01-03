import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { TenantService } from "@/spaces/platform/server/tenant.service";
import { TenantUserInvitationService } from "@/spaces/platform/server/tenant-user-invitation.service";

const schemas = {
  GET: z.object({}),
  POST: z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(["owner", "admin", "member"], {
      required_error: "Role is required",
      invalid_type_error: "Role must be owner, admin, or member",
    }),
    message: z.string().optional(),
  }),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  GET: async ({ dangerSupabaseAdmin, apiUser, tenantId }) => {
    // Get user's role in this tenant first
    const tempTenantService = TenantService.create(
      dangerSupabaseAdmin,
      apiUser.id,
      tenantId
    );
    const userRole = await tempTenantService.getUserRoleInTenant(tenantId);

    // Create tenant user invitation service instance with full context including role
    const invitationService = TenantUserInvitationService.create(
      dangerSupabaseAdmin,
      apiUser.id,
      tenantId,
      userRole || "viewer"
    );

    // Get invitations and stats
    const [invitations, stats] = await Promise.all([
      invitationService.listInvitations(),
      invitationService.getInvitationStats(),
    ]);

    return {
      invitations,
      stats,
    };
  },
  POST: async ({ dangerSupabaseAdmin, requestData, apiUser, tenantId }) => {
    // Get user's role in this tenant first
    const tempTenantService = TenantService.create(
      dangerSupabaseAdmin,
      apiUser.id,
      tenantId
    );
    const userRole = await tempTenantService.getUserRoleInTenant(tenantId);

    // Create tenant user invitation service instance with full context including role
    const invitationService = TenantUserInvitationService.create(
      dangerSupabaseAdmin,
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
