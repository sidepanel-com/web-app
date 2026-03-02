import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  V1ApiService,
  V1ApiHandlers,
} from "@/spaces/packages/workspace/server/v1-api-service";
import { PeopleService } from "@/spaces/packages/workspace/server/people.service";
import { ApiError } from "@/spaces/platform/server/next-api-errors";

const schemas = {
  POST: z.object({
    personId: z.string().uuid(),
    commId: z.string().uuid().optional(),
    type: z
      .enum(["email", "phone", "linkedin", "slack", "whatsapp", "other"])
      .optional(),
    value: z.any().optional(),
  }),
  DELETE: z.object({
    personId: z.string().uuid(),
    commId: z.string().uuid(),
  }),
};

const handlers: V1ApiHandlers<typeof schemas> = {
  POST: async ({ db, requestData, apiUser, tenantId, userRole, memberProfileId, orgUnitIds, orgUnitPaths }) => {
    const peopleService = PeopleService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined,
      memberProfileId,
      orgUnitIds,
      orgUnitPaths,
    );
    const { personId, commId, type, value } = requestData;

    if (commId) {
      await peopleService.addCommLink(personId, commId);
      return { success: true };
    } else if (type && value) {
      return await peopleService.createAndLinkComm(personId, { type, value });
    }
    throw new ApiError("BAD_REQUEST", "Either commId or comm type/value must be provided");
  },
  DELETE: async ({ db, requestData, apiUser, tenantId, userRole, memberProfileId, orgUnitIds, orgUnitPaths }) => {
    const peopleService = PeopleService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined,
      memberProfileId,
      orgUnitIds,
      orgUnitPaths,
    );
    await peopleService.removeCommLink(
      requestData.personId,
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
