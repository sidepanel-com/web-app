import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  V1ApiService,
  V1ApiHandlers,
} from "@/spaces/packages/workspace/server/v1-api-service";
import { CompaniesService } from "@/spaces/packages/workspace/server/companies.service";

const schemas = {
  GET: z.object({}),
  POST: z.object({
    name: z.string().min(1),
    logoUrl: z.string().optional(),
    description: z.string().optional(),
    domains: z
      .array(
        z.object({
          domain: z.string().min(1),
          isPrimary: z.boolean().optional(),
        })
      )
      .optional(),
    websites: z
      .array(
        z.object({
          url: z.string().min(1),
          type: z.string().optional(),
          isPrimary: z.boolean().optional(),
        })
      )
      .optional(),
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
