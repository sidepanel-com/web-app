import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { TenantUserInvitationService } from "@/spaces/platform/server/tenant-user-invitation.service";
import { TenantService } from "@/spaces/platform/server/tenant.service";

const schemas = {
  POST: z.object({
    invitationId: z.string(),
    action: z.enum(["resend"]),
  }),
  DELETE: z.object({
    invitationId: z.string(),
  }),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  // Resend invitation
  POST: async ({ dangerSupabaseAdmin, requestData, apiUser, tenantId }) => {
    // Get user's role in this tenant first
    const tempTenantService = TenantService.create(
      dangerSupabaseAdmin,
      apiUser.id,
      tenantId
    );
    const userRole = await tempTenantService.getUserRoleInTenant(tenantId);

    // Create invitation service with full context
    const invitationService = TenantUserInvitationService.create(
      dangerSupabaseAdmin,
      apiUser.id,
      tenantId,
      userRole || "viewer"
    );

    if (requestData.action === "resend") {
      const invitation = await invitationService.resendInvitation(
        requestData.invitationId
      );

      return {
        invitation,
        message: "Invitation resent successfully",
      };
    }

    throw new Error("Invalid action");
  },

  // Cancel/delete invitation
  DELETE: async ({ dangerSupabaseAdmin, requestData, apiUser, tenantId }) => {
    // Get user's role in this tenant first
    const tempTenantService = TenantService.create(
      dangerSupabaseAdmin,
      apiUser.id,
      tenantId
    );
    const userRole = await tempTenantService.getUserRoleInTenant(tenantId);

    // Create invitation service with full context
    const invitationService = TenantUserInvitationService.create(
      dangerSupabaseAdmin,
      apiUser.id,
      tenantId,
      userRole || "viewer"
    );

    await invitationService.cancelInvitation(requestData.invitationId);

    return {
      success: true,
      message: "Invitation canceled successfully",
    };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
