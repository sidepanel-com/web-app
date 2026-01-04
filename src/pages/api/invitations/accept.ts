import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { UserApiService, UserApiHandlers } from "@/spaces/platform/server/next-api-service";
import { TenantUserInvitationService } from "@/spaces/platform/server/tenant-user-invitation.service";

const schemas = {
  GET: z.object({
    token: z.string(),
  }),
  POST: z.object({
    token: z.string(),
  }),
};

const handlers: UserApiHandlers<typeof schemas> = {
  // Get invitation details by token
  GET: async ({ db, dangerSupabaseAdmin, requestData }) => {
    // Create invitation service without user context for token lookup
    const invitationService = new TenantUserInvitationService(
      db,
      dangerSupabaseAdmin,
      { userId: "", tenantId: "" } // Minimal context for token lookup
    );

    const invitation = await invitationService.getInvitationByToken(
      requestData.token
    );

    if (!invitation) {
      throw new Error("Invalid or expired invitation");
    }

    return {
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        tenant: invitation.tenant,
        invited_by_user: invitation.invited_by_user,
        expires_at: invitation.expires_at,
      },
    };
  },

  // Accept invitation
  POST: async ({ db, dangerSupabaseAdmin, requestData, apiUser }) => {
    // Create invitation service without user context for token lookup
    const invitationService = new TenantUserInvitationService(
      db,
      dangerSupabaseAdmin,
      { userId: "", tenantId: "" } // Minimal context for token lookup
    );

    await invitationService.acceptInvitation(requestData.token, apiUser.id);

    return {
      success: true,
      message: "Invitation accepted successfully",
    };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new UserApiService(handlers, schemas).run(req, res);
}
