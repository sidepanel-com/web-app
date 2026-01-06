import { Tables } from "@/types/database.types";
import { ApiClient, ApiResponse } from "./index";

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  timezone?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
}

export interface UserProfileWithAuth extends Tables<"user_profiles"> {
  email_confirmed_at?: string;
}

export class UserProfileClientAPI {
  private fetchClient: ApiClient;

  constructor(fetchClient: ApiClient) {
    this.fetchClient = fetchClient;
  }

  /**
   * Get the current user's profile
   */
  async getProfile(): Promise<ApiResponse<UserProfileWithAuth>> {
    const response = await this.fetchClient.get("/user/profile");
    return response as ApiResponse<UserProfileWithAuth>;
  }

  /**
   * Update the current user's profile
   */
  async updateProfile(
    profileData: UserProfileUpdate
  ): Promise<
    ApiResponse<{ profile: Tables<"user_profiles">; message: string }>
  > {
    const response = await this.fetchClient.patch("/user/profile", profileData);
    return response as ApiResponse<{
      profile: Tables<"user_profiles">;
      message: string;
    }>;
  }
}
