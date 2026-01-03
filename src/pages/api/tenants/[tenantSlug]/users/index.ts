import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  type TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { TenantService } from "@/spaces/platform/server/tenant.service";
import { TenantUserService } from "@/spaces/platform/server/tenant-user.service";

const schemas = {
  GET: z.object({}),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  GET: async ({ db, apiUser, tenantId }) => {
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

    // Get users and stats
    const [users, stats] = await Promise.all([
      tenantUserService.listTenantUsers(),
      tenantUserService.getUserStats(),
    ]);

    return {
      users,
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
