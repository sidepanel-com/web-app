import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { TenantUserInvitationService } from "@/spaces/platform/server/tenant-user-invitation.service";
import { TenantService } from "@/spaces/platform/server/tenant.service";

const schemas = {
  GET: z.object({}),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  // List all invitations for the tenant
  GET: async ({ db, dangerSupabaseAdmin, apiUser, tenantId }) => {
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
      dangerSupabaseAdmin,
      apiUser.id,
      tenantId,
      userRole || "viewer"
    );

    // Get invitations list and stats
    const [invitations, stats] = await Promise.all([
      invitationService.listInvitations(),
      invitationService.getInvitationStats(),
    ]);

    return {
      invitations,
      stats,
    };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
