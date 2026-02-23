import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  V1ApiService,
  V1ApiHandlers,
} from "@/spaces/packages/workspace/server/v1-api-service";
import { PeopleService } from "@/spaces/packages/workspace/server/people.service";
import { TenantService } from "@/spaces/platform/server/tenant.service";

const schemas = {
  GET: z.object({}),
  POST: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    bio: z.string().optional(),
  }),
};

const handlers: V1ApiHandlers<typeof schemas> = {
  GET: async ({ db, apiUser, tenantId, userRole }) => {
    const peopleService = PeopleService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined
    );

    return await peopleService.getPeople();
  },
  POST: async ({ db, requestData, apiUser, tenantId, userRole }) => {
    const peopleService = PeopleService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined
    );

    return await peopleService.createPerson(requestData);
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new V1ApiService(handlers, schemas).run(req, res);
}

