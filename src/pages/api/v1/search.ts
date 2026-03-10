import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  V1ApiService,
  V1ApiHandlers,
} from "@/spaces/platform/server/v1-api-service";
import { SearchService } from "@/spaces/packages/workspace/server/search.service";

const schemas = {
  GET: z.object({
    q: z.string().min(1),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
};

const handlers: V1ApiHandlers<typeof schemas> = {
  GET: async ({
    db,
    requestData,
    apiUser,
    tenantId,
    userRole,
    memberProfileId,
    orgUnitIds,
    orgUnitPaths,
  }) => {
    const service = SearchService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined,
      memberProfileId,
      orgUnitIds,
      orgUnitPaths,
    );

    return await service.search(requestData.q, requestData.limit);
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return new V1ApiService(handlers, schemas).run(req, res);
}
