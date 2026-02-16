import { PathTenantApiService } from "@/spaces/platform/server/next-api-service";
import { IntegrationService } from "@/spaces/integrations/server/integration.service";
import { z } from "zod";
import {
  IntegrationMethod,
  IntegrationProvider,
} from "@/spaces/integrations/core/types";
import type { DrizzleClient } from "@/spaces/platform/server/db";
import type { ApiUser } from "@/spaces/platform/server/next-api-service";
import { PermissionContext } from "@/spaces/platform/server/base-entity.service";

const callbackSchema = z.object({
  provider: z.nativeEnum(IntegrationProvider),
  method: z.nativeEnum(IntegrationMethod),
  providerAccountId: z.string(),
  connectionData: z.any().optional(),
});

const handlers = {
  POST: async ({
    db,
    apiUser,
    tenantId,
    requestData,
  }: {
    db: DrizzleClient;
    apiUser: ApiUser;
    tenantId: string;
    requestData: z.infer<typeof callbackSchema>;
  }) => {
    const { provider, method, providerAccountId, connectionData } = requestData;
    const service = IntegrationService.create(db, apiUser.id, tenantId);
    return await service.finalizeConnection(
      tenantId,
      provider,
      method,
      providerAccountId,
      connectionData,
    );
  },
};

export default async function handler(req: any, res: any) {
  return new PathTenantApiService(handlers, { POST: callbackSchema }).run(
    req,
    res,
  );
}
