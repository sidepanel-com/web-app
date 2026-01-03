import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { UserApiService, UserApiHandlers } from "@/spaces/platform/server/next-api-service";
import { TenantService } from "@/spaces/platform/server/tenant.service";
import { db } from "@/spaces/platform/server/db";

const schemas = {
  POST: z.object({
    name: z.string().min(1),
  }),
};

const handlers: UserApiHandlers<typeof schemas> = {
  GET: async ({ apiUser }) => {
    // Use factory function instead of static method
    const tenantService = TenantService.create(db, apiUser.id);
    return await tenantService.getUserTenants();
  },
  POST: async ({ requestData, apiUser }) => {
    // Use factory function instead of static method
    const tenantService = TenantService.create(db, apiUser.id);
    return await tenantService.createTenantWithOwner({
      name: requestData.name,
    });
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new UserApiService(handlers, schemas).run(req, res);
}
