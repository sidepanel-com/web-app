import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  type TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { TenantService } from "@/spaces/platform/server/tenant.service";
import { TenantUserService } from "@/spaces/platform/server/tenant-user.service";
import { TenantUserInvitationService } from "@/spaces/platform/server/tenant-user-invitation.service";

const schemas = {
  GET: z.object({}),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  GET: async ({ db, dangerSupabaseAdmin, apiUser, tenantId }) => {
    // Get user's role in this tenant first
    const tempTenantService = TenantService.create(db, apiUser.id, tenantId);
    const userRole = await tempTenantService.getUserRoleInTenant(tenantId);

    // Create tenant user service instance with full context including role
    const tenantUserService = TenantUserService.create(
      db,
      apiUser.id,
      tenantId,
      userRole || "viewer"
    );

    const invitationService = TenantUserInvitationService.create(
      db,
      dangerSupabaseAdmin,
      apiUser.id,
      tenantId,
      userRole || "viewer"
    );

    // Get users, user stats, and invitations
    const [users, userStats, invitations] = await Promise.all([
      tenantUserService.listTenantUsers(),
      tenantUserService.getUserStats(),
      invitationService.listInvitations(),
    ]);

    // Map invitations to TenantUserListItem
    const invitedUsers: any[] = invitations.map((inv) => ({
      id: inv.id,
      user_id: "", // Placeholder for pending users
      role: inv.role,
      status: "pending",
      joined_at: inv.createdAt,
      invited_by: inv.invitedByUser
        ? `${inv.invitedByUser.firstName || ""} ${
            inv.invitedByUser.lastName || ""
          }`.trim() || null
        : null,
      invited_by_email: null,
      email: inv.email,
      first_name: null,
      last_name: null,
      avatar_url: null,
      permissions: {},
    }));

    // Merge users and invitations
    const allUsers = [...users, ...invitedUsers];

    // Merge stats
    const stats = {
      ...userStats,
      total:
        userStats.total +
        invitations.filter((i) => i.status === "pending").length,
      pending:
        userStats.pending +
        invitations.filter((i) => i.status === "pending").length,
    };

    // Update byRole stats with invitations
    invitations.forEach((inv) => {
      if (inv.status === "pending" && inv.role) {
        if (stats.byRole[inv.role] !== undefined) {
          stats.byRole[inv.role]++;
        } else {
          // @ts-ignore
          stats.byRole[inv.role] = 1;
        }
      }
    });

    return {
      users: allUsers,
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
