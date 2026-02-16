import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  type TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { ApiError } from "@/spaces/platform/server/next-api-errors";
import { TenantService } from "@/spaces/platform/server/tenant.service";
import { ApiKeyService } from "@/spaces/platform/server/api-key.service";

const schemas = {
  DELETE: z.object({
    keyId: z.string().uuid(),
  }),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  DELETE: async ({ db, requestData, apiUser, tenantId }) => {
    const tenantService = TenantService.create(db, apiUser.id, tenantId);
    const userRole = await tenantService.getUserRoleInTenant(tenantId);
    if (userRole !== "owner") {
      throw new ApiError(
        "FORBIDDEN",
        "Only tenant owners can revoke API keys"
      );
    }

    const apiKeyService = new ApiKeyService(db);
    await apiKeyService.revoke(tenantId, requestData.keyId);
    return { success: true, message: "API key revoked" };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
