import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  V1ApiService,
  V1ApiHandlers,
} from "@/spaces/product/server/v1-api-service";
import { CompaniesService } from "@/spaces/product/server/companies.service";

const schemas = {
  GET: z.object({}),
  POST: z.object({
    name: z.string().min(1),
    domain: z.string().optional(),
    logoUrl: z.string().optional(),
    description: z.string().optional(),
  }),
};

const handlers: V1ApiHandlers<typeof schemas> = {
  GET: async ({ db, apiUser, tenantId, userRole }) => {
    const companiesService = CompaniesService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined
    );

    return await companiesService.getCompanies();
  },
  POST: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const companiesService = CompaniesService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined
    );

    return await companiesService.createCompany(requestData);
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new V1ApiService(handlers, schemas).run(req, res);
}
