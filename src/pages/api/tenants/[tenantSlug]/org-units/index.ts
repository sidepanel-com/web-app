import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { OrgUnitService } from "@/spaces/permissions/server/org-unit.service";
import {
  PathTenantApiService,
  type TenantApiHandlers,
} from "@/spaces/platform/server/next-api-service";

const schemas = {
  GET: z.object({}),
  POST: z.object({
    name: z.string().min(1, "Name is required").max(255),
    parentOrgUnitId: z.string().uuid().nullish(),
  }),
};

const handlers: TenantApiHandlers<typeof schemas> = {
  GET: async ({ db, tenantId }) => {
    const service = OrgUnitService.create(db, tenantId);
    const orgUnits = await service.list();
    return { orgUnits };
  },
  POST: async ({ db, tenantId, requestData }) => {
    const service = OrgUnitService.create(db, tenantId);
    const orgUnit = await service.createOrgUnit(
      requestData.name,
      requestData.parentOrgUnitId,
    );
    return { orgUnit };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return new PathTenantApiService(handlers, schemas).run(req, res);
}
