import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  PathTenantApiService,
  type TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";
import { MemberProfileService } from "@/spaces/packages/workspace/server/member-profile.service";

const schemas = {
  GET: z.object({}),
  POST: z.object({
    tenantUserId: z.string().uuid("Invalid tenant user ID"),
  }),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  GET: async ({ db, tenantId }) => {
    const service = MemberProfileService.create(db, tenantId);
    const members = await service.getMembersWithStatus();
    return { members };
  },
  POST: async ({ db, tenantId, requestData }) => {
    const service = MemberProfileService.create(db, tenantId);
    const profile = await service.createMemberProfile(requestData.tenantUserId);
    return { profile };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
