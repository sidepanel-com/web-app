import { PathTenantApiService } from "@/spaces/platform/server/next-api-service";
import { IntegrationService } from "@/spaces/integrations/server/integration.service";
import { z } from "zod";
import {
  IntegrationMethod,
  IntegrationProvider,
} from "@/spaces/integrations/core/types";
import type { DrizzleClient } from "@/spaces/platform/server/db";
import type { ApiUser } from "@/spaces/platform/server/next-api-service";

const connectSchema = z.object({
  provider: z.nativeEnum(IntegrationProvider),
  method: z.nativeEnum(IntegrationMethod),
});

const handlers = {
  GET: async ({
    db,
    apiUser,
    tenantId,
  }: {
    db: DrizzleClient;
    apiUser: ApiUser;
    tenantId: string;
  }) => {
    console.log("GET integrations for tenant", tenantId, "user", apiUser.id);
    try {
      const service = IntegrationService.create(db, apiUser.id, tenantId);
      const connections = await service.listConnections(tenantId);
      console.log("Found connections", connections.length);

      // Map DB connections to a friendlier UI format
      return connections.map((conn) => ({
        id: conn.id,
        provider: conn.provider,
        isActive: conn.status === "active",
        providerAccountId: conn.externalId,
        method: IntegrationMethod.PIPEDREAM_CONNECT, // For now assuming all are Pipedream
      }));
    } catch (e) {
      console.error("Error in GET integrations", e);
      throw e;
    }
  },
  POST: async ({
    db,
    apiUser,
    tenantId,
    requestData,
  }: {
    db: DrizzleClient;
    apiUser: ApiUser;
    tenantId: string;
    requestData: z.infer<typeof connectSchema>;
  }) => {
    const { provider, method } = requestData;
    const service = IntegrationService.create(db, apiUser.id, tenantId);
    return await service.connect(tenantId, provider, method);
  },
};

export default async function handler(req: any, res: any) {
  return new PathTenantApiService(handlers, { POST: connectSchema }).run(
    req,
    res,
  );
}
