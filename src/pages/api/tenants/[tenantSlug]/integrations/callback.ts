import { PathTenantApiService } from "@/spaces/platform/server/next-api-service";
import { IntegrationService } from "@/spaces/integrations/server/integration.service";
import { z } from "zod";
import { IntegrationMethod, IntegrationProvider } from "@/spaces/integrations/core/types";

const callbackSchema = z.object({
  provider: z.nativeEnum(IntegrationProvider),
  method: z.nativeEnum(IntegrationMethod),
  providerAccountId: z.string(),
  connectionData: z.any().optional(),
});

const handlers = {
  POST: async ({ db, apiUser, tenantId, requestData }) => {
    const { provider, method, providerAccountId, connectionData } = requestData;
    const service = IntegrationService.create(db, apiUser.id, tenantId);
    return await service.finalizeConnection(
      tenantId,
      provider,
      method,
      providerAccountId,
      connectionData
    );
  },
};

export default async function handler(req: any, res: any) {
  return new PathTenantApiService(handlers, { POST: callbackSchema }).run(req, res);
}

