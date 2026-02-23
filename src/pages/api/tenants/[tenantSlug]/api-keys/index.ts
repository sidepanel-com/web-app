import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  type TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { ApiError } from "@/spaces/platform/server/next-api-errors";
import { TenantService } from "@/spaces/platform/server/tenant.service";
import { ApiKeyService } from "@/spaces/platform/server/api-key.service";
import { userProfiles } from "@db/platform/schema";
import { eq } from "drizzle-orm";
import { COMMS_SCOPES_FULL } from "@/spaces/packages/workspace/server/scopes";

const schemas = {
  GET: z.object({}),
  POST: z.object({
    name: z.string().min(1, "Name is required"),
    scopes: z.array(z.string()).optional(),
    expiresAt: z.string().datetime().optional().nullable(),
  }),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  GET: async ({ db, apiUser, tenantId }) => {
    const tenantService = TenantService.create(db, apiUser.id, tenantId);
    const userRole = await tenantService.getUserRoleInTenant(tenantId);
    if (userRole !== "owner") {
      throw new ApiError(
        "FORBIDDEN",
        "Only tenant owners can list API keys"
      );
    }

    const apiKeyService = new ApiKeyService(db);
    const keys = await apiKeyService.list(tenantId);
    return { keys };
  },
  POST: async ({ db, requestData, apiUser, tenantId }) => {
    const tenantService = TenantService.create(db, apiUser.id, tenantId);
    const userRole = await tenantService.getUserRoleInTenant(tenantId);
    if (userRole !== "owner") {
      throw new ApiError(
        "FORBIDDEN",
        "Only tenant owners can create API keys"
      );
    }

    const [profile] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, apiUser.id))
      .limit(1);
    if (!profile) {
      throw new ApiError("NOT_FOUND", "User profile not found");
    }

    const scopes =
      requestData.scopes && requestData.scopes.length > 0
        ? requestData.scopes
        : COMMS_SCOPES_FULL;

    const apiKeyService = new ApiKeyService(db);
    const created = await apiKeyService.create(tenantId, profile.id, {
      name: requestData.name,
      scopes,
      expiresAt: requestData.expiresAt ?? undefined,
    });

    return {
      key: created,
      message:
        "API key created. Copy the key now — it will not be shown again.",
    };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
