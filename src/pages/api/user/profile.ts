import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { UserApiService, UserApiHandlers } from "@/spaces/platform/server/next-api-service";
import { UserProfileService } from "@/spaces/platform/server/user-profile.service";

const schemas = {
  GET: z.object({}),
  PATCH: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
    timezone: z.string().optional(),
    avatar_url: z.string().url().optional(),
    preferences: z.record(z.string(), z.any()).optional(),
  }),
};

const handlers: UserApiHandlers<typeof schemas> = {
  // Get user profile
  GET: async ({ db, dangerSupabaseAdmin, apiUser }) => {
    const userProfileService = UserProfileService.create(
      db,
      dangerSupabaseAdmin,
      apiUser.id
    );

    const profile = await userProfileService.getProfileWithAuth();

    return profile;
  },

  // Update user profile
  PATCH: async ({ db, dangerSupabaseAdmin, requestData, apiUser }) => {
    const userProfileService = UserProfileService.create(
      db,
      dangerSupabaseAdmin,
      apiUser.id
    );

    const updatedProfile = await userProfileService.upsertProfile(requestData);

    return {
      profile: updatedProfile,
      message: "Profile updated successfully",
    };
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new UserApiService(handlers, schemas).run(req, res);
}
