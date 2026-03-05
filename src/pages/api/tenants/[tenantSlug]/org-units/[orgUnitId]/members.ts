import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { OrgUnitService } from "@/spaces/permissions/server/org-unit.service";
import {
  PathTenantApiService,
  type TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";

const schemas = {
  GET: z.object({
    orgUnitId: z.string().uuid(),
  }),
  POST: z.object({
    orgUnitId: z.string().uuid(),
    memberProfileId: z.string().uuid("Invalid member profile ID"),
  }),
  DELETE: z.object({
    orgUnitId: z.string().uuid(),
    memberProfileId: z.string().uuid("Invalid member profile ID"),
  }),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  GET: async ({ db, tenantId, requestData }) => {
    const service = OrgUnitService.create(db, tenantId);
    const members = await service.getMembers(requestData.orgUnitId);
    return { members };
  },
  POST: async ({ db, tenantId, requestData }) => {
    const service = OrgUnitService.create(db, tenantId);
    const assignment = await service.assignMember(
      requestData.orgUnitId,
      requestData.memberProfileId,
    );
    return { assignment };
  },
  DELETE: async ({ db, tenantId, requestData }) => {
    const service = OrgUnitService.create(db, tenantId);
    await service.removeMember(
      requestData.orgUnitId,
      requestData.memberProfileId,
    );
    return {};
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
