import { PathTenantApiService } from "@/spaces/platform/server/next-api-service";
import { IntegrationService } from "@/spaces/integrations/server/integration.service";
import { z } from "zod";
import { IntegrationMethod, IntegrationProvider } from "@/spaces/integrations/core/types";

const disconnectSchema = z.object({
  provider: z.nativeEnum(IntegrationProvider),
  method: z.nativeEnum(IntegrationMethod),
});

const handlers = {
  POST: async ({ db, apiUser, tenantId, requestData }) => {
    const { provider, method } = requestData;
    const service = IntegrationService.create(db, apiUser.id, tenantId);
    await service.disconnect(tenantId, provider, method);
    return { success: true };
  },
};

export default async function handler(req: any, res: any) {
  return new PathTenantApiService(handlers, { POST: disconnectSchema }).run(req, res);
}

