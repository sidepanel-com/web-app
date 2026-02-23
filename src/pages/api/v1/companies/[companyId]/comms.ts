import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  V1ApiService,
  V1ApiHandlers,
} from "@/spaces/packages/workspace/server/v1-api-service";
import { CompaniesService } from "@/spaces/packages/workspace/server/companies.service";

const schemas = {
  POST: z.object({
    companyId: z.string().uuid(),
    commId: z.string().uuid().optional(),
    type: z
      .enum(["email", "phone", "linkedin", "slack", "whatsapp", "other"])
      .optional(),
    value: z.any().optional(),
  }),
  DELETE: z.object({
    companyId: z.string().uuid(),
    commId: z.string().uuid(),
  }),
};

const handlers: V1ApiHandlers<typeof schemas> = {
  POST: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const companiesService = CompaniesService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined
    );
    const { companyId, commId, type, value } = requestData;

    if (commId) {
      await companiesService.addCommLink(companyId, commId);
      return { success: true };
    } else if (type && value) {
      return await companiesService.createAndLinkComm(companyId, {
        type,
        value,
      });
    }
    throw new Error("Either commId or comm type/value must be provided");
  },
  DELETE: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const companiesService = CompaniesService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined
    );
    await companiesService.removeCommLink(
      requestData.companyId,
      requestData.commId
    );
    return { success: true };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new V1ApiService(handlers, schemas).run(req, res);
}
