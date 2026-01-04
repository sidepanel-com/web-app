import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { V1ApiService, V1ApiHandlers } from "@/spaces/product/server/v1-api-service";
import { CompaniesService } from "@/spaces/product/server/companies.service";

const schemas = {
  POST: z.object({
    companyId: z.string().uuid(),
    personId: z.string().uuid().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.string().optional(),
    isPrimary: z.boolean().optional(),
  }),
  DELETE: z.object({
    companyId: z.string().uuid(),
    personId: z.string().uuid(),
  }),
};

const handlers: V1ApiHandlers<typeof schemas> = {
  POST: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const companiesService = CompaniesService.create(db, apiUser.supabaseUserId, tenantId, userRole || undefined);
    const { companyId, personId, firstName, lastName, role, isPrimary } = requestData;

    if (personId) {
      await companiesService.addPersonLink(companyId, personId, role, isPrimary);
      return { success: true };
    } else if (firstName && lastName) {
      return await companiesService.createAndLinkPerson(companyId, { firstName, lastName }, role, isPrimary);
    }
    throw new Error("Either personId or person names must be provided");
  },
  DELETE: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const companiesService = CompaniesService.create(db, apiUser.supabaseUserId, tenantId, userRole || undefined);
    await companiesService.removePersonLink(requestData.companyId, requestData.personId);
    return { success: true };
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return new V1ApiService(handlers, schemas).run(req, res);
}

