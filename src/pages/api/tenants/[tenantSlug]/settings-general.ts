import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { TenantService } from "@/spaces/platform/server/tenant.service";

const schemas = {
  PATCH: z.object({
    name: z.string().min(1),
  }),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  PATCH: async ({ db, requestData, apiUser, tenantId }) => {
    // Get user's role in this tenant first
    const tempTenantService = TenantService.create(
      db,
      apiUser.id,
      tenantId
    );
    const userRole = await tempTenantService.getUserRoleInTenant(tenantId);

    // Create tenant service instance with full context including role
    const tenantService = TenantService.create(
      db,
      apiUser.id,
      tenantId,
      userRole || undefined
    );

    // Update tenant with permission checking
    const tenant = await tenantService.updateTenant(tenantId, {
      name: requestData.name,
    });

    return tenant;
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
