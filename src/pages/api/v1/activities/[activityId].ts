import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  V1ApiService,
  V1ApiHandlers,
} from "@/spaces/platform/server/v1-api-service";
import { ActivitiesService } from "@/spaces/packages/workspace/server/activities.service";

const schemas = {
  GET: z.object({
    activityId: z.string().uuid(),
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
    const service = ActivitiesService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined,
      memberProfileId,
      orgUnitIds,
      orgUnitPaths,
    );

    return await service.getActivityById(requestData.activityId);
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return new V1ApiService(handlers, schemas).run(req, res);
}
