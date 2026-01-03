import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { ApiService, ApiHandlers } from "@/spaces/platform/server/next-api-service";
import { TenantUserInvitationService } from "@/spaces/platform/server/tenant-user-invitation.service";

const schemas = {
  POST: z.object({
    token: z.string(),
  }),
};

const handlers: ApiHandlers<typeof schemas> = {
  // Decline invitation (no auth required)
  POST: async ({ dangerSupabaseAdmin, requestData }) => {
    // Create invitation service without user context for token lookup
    const invitationService = new TenantUserInvitationService(
      dangerSupabaseAdmin,
      { userId: "", tenantId: "" } // Minimal context for token lookup
    );

    await invitationService.declineInvitation(requestData.token);

    return {
      success: true,
      message: "Invitation declined successfully",
    };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new ApiService(handlers, schemas).run(req, res);
}
