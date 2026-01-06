import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { V1ApiService, V1ApiHandlers } from "@/spaces/product/server/v1-api-service";
import { PeopleService } from "@/spaces/product/server/people.service";

const schemas = {
  POST: z.object({
    personId: z.string().uuid(),
    companyId: z.string().uuid().optional(),
    name: z.string().optional(),
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
    role: z.string().optional(),
    isPrimary: z.boolean().optional(),
  }),
  DELETE: z.object({
    personId: z.string().uuid(),
    companyId: z.string().uuid(),
  }),
};

const handlers: V1ApiHandlers<typeof schemas> = {
  POST: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const peopleService = PeopleService.create(db, apiUser.supabaseUserId, tenantId, userRole || undefined);
    const { personId, companyId, name, domains, websites, role, isPrimary } = requestData;

    if (companyId) {
      await peopleService.addCompanyLink(personId, companyId, role, isPrimary);
      return { success: true };
    } else if (name) {
      return await peopleService.createAndLinkCompany(
        personId,
        { name, domains, websites },
        role,
        isPrimary
      );
    }
    throw new Error("Either companyId or company name must be provided");
  },
  DELETE: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const peopleService = PeopleService.create(db, apiUser.supabaseUserId, tenantId, userRole || undefined);
    await peopleService.removeCompanyLink(requestData.personId, requestData.companyId);
    return { success: true };
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return new V1ApiService(handlers, schemas).run(req, res);
}


