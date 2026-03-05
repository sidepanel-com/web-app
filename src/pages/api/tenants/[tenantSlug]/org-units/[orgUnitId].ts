import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { OrgUnitService } from "@/spaces/permissions/server/org-unit.service";
import {
  PathTenantApiService,
  type TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";

const schemas = {
  PATCH: z.object({
    orgUnitId: z.string().uuid(),
    name: z.string().min(1).max(255).optional(),
    parentOrgUnitId: z.string().uuid().nullish(),
  }),
  DELETE: z.object({
    orgUnitId: z.string().uuid(),
  }),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  PATCH: async ({ db, tenantId, requestData }) => {
    const service = OrgUnitService.create(db, tenantId);
    const orgUnit = await service.update(requestData.orgUnitId, {
      name: requestData.name,
      parentOrgUnitId: requestData.parentOrgUnitId,
    });
    return { orgUnit };
  },
  DELETE: async ({ db, tenantId, requestData }) => {
    const service = OrgUnitService.create(db, tenantId);
    await service.delete(requestData.orgUnitId);
    return {};
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
