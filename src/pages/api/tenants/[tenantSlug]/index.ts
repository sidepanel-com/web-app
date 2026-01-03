import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { TenantService } from "@/spaces/platform/server/tenant.service";

const schemas = {
  GET: z.object({}),
  PATCH: z.object({
    name: z.string().min(1),
  }),
  DELETE: z.object({}),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  GET: async ({ db, requestData, apiUser, tenantId }) => {
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

    // Get tenant with permission checking
    return await tenantService.getTenantById(tenantId);
  },
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
  DELETE: async ({ db, requestData, apiUser, tenantId }) => {
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

    // Delete tenant with permission checking
    await tenantService.deleteTenant(tenantId);

    return { success: true };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
