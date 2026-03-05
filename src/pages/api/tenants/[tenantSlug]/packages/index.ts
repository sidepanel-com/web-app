import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  type TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { ApiError } from "@/spaces/platform/server/next-api-errors";
import { TenantService } from "@/spaces/platform/server/tenant.service";
import { PackageService } from "@/spaces/platform/server/package.service";

const schemas = {
  GET: z.object({}),
  PUT: z.object({
    packageId: z.string().min(1),
    enabled: z.boolean(),
  }),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  GET: async ({ db, tenantId }) => {
    const packageService = new PackageService(db);
    return packageService.getPackageStates(tenantId);
  },

  PUT: async ({ db, apiUser, tenantId, requestData }) => {
    const tenantService = TenantService.create(db, apiUser.id, tenantId);
    const userRole = await tenantService.getUserRoleInTenant(tenantId);
    if (userRole !== "owner" && userRole !== "admin") {
      throw new ApiError(
        "FORBIDDEN",
        "Only tenant owners or admins can manage packages",
      );
    }

    const packageService = new PackageService(db);
    return packageService.setPackageEnabled(
      tenantId,
      requestData.packageId,
      requestData.enabled,
    );
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
