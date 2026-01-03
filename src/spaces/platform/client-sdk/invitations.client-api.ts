import { Tables } from "@/types/database.types";
import { ApiClient, ApiResponse } from "./index";

export interface InvitationDetails {
  id: string;
  email: string;
  role: Tables<"tenant_users">["role"];
  tenant?: {
    name: string;
    slug: string;
  };
  invited_by_user?: {
    first_name: string | null;
    last_name: string | null;
  };
  expires_at: string | null;
}

export class InvitationsClientAPI {
  private fetchClient: ApiClient;

  constructor(fetchClient: ApiClient) {
    this.fetchClient = fetchClient;
  }

  /**
   * Get invitation details by token
   */
  async getInvitationByToken(
    token: string
  ): Promise<ApiResponse<{ invitation: InvitationDetails }>> {
    const response = await this.fetchClient.get(
      `/invitations/accept?token=${encodeURIComponent(token)}`
    );
    return response as ApiResponse<{ invitation: InvitationDetails }>;
  }

  /**
   * Accept an invitation (requires authentication)
   */
  async acceptInvitation(
    token: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.fetchClient.post("/invitations/accept", {
      token,
    });
    return response as ApiResponse<{ success: boolean; message: string }>;
  }

  /**
   * Decline an invitation (no authentication required)
   */
  async declineInvitation(
    token: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.fetchClient.post("/invitations/decline", {
      token,
    });
    return response as ApiResponse<{ success: boolean; message: string }>;
  }
}
