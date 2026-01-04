import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  V1ApiService,
  V1ApiHandlers,
} from "@/spaces/product/server/v1-api-service";
import { CompaniesService } from "@/spaces/product/server/companies.service";

const schemas = {
  GET: z.object({
    companyId: z.string().uuid(),
  }),
  PATCH: z.object({
    companyId: z.string().uuid(),
    name: z.string().optional(),
    domain: z.string().optional(),
    logoUrl: z.string().optional(),
    description: z.string().optional(),
  }),
  DELETE: z.object({
    companyId: z.string().uuid(),
  }),
};

const handlers: V1ApiHandlers<typeof schemas> = {
  GET: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const companiesService = CompaniesService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined
    );

    return await companiesService.getCompanyById(requestData.companyId);
  },
  PATCH: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const companiesService = CompaniesService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined
    );

    const { companyId, ...updates } = requestData;
    return await companiesService.updateCompany(companyId, updates);
  },
  DELETE: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const companiesService = CompaniesService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined
    );

    await companiesService.deleteCompany(requestData.companyId);
    return { success: true };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new V1ApiService(handlers, schemas).run(req, res);
}

