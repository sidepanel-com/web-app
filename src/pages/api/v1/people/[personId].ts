import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  V1ApiService,
  V1ApiHandlers,
} from "@/spaces/product/server/v1-api-service";
import { PeopleService } from "@/spaces/product/server/people.service";
import { TenantService } from "@/spaces/platform/server/tenant.service";

const schemas = {
  GET: z.object({
    personId: z.string().uuid(),
  }),
  PATCH: z.object({
    personId: z.string().uuid(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    bio: z.string().optional(),
  }),
  DELETE: z.object({
    personId: z.string().uuid(),
  }),
};

const handlers: V1ApiHandlers<typeof schemas> = {
  GET: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const peopleService = PeopleService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined
    );

    return await peopleService.getPersonById(requestData.personId);
  },
  PATCH: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const peopleService = PeopleService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined
    );

    const { personId, ...updates } = requestData;
    return await peopleService.updatePerson(personId, updates);
  },
  DELETE: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const peopleService = PeopleService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined
    );

    await peopleService.deletePerson(requestData.personId);
    return { success: true };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new V1ApiService(handlers, schemas).run(req, res);
}

