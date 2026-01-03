import { Tables } from "@/types/database.types";
import { ApiClient, ApiResponse } from "./index";

type InvitationStatus = Tables<"tenant_invitations">["status"];

export interface InvitationWithDetails extends Tables<"tenant_invitations"> {
  invited_by_user?: {
    first_name: string | null;
    last_name: string | null;
  };
  tenant?: {
    name: string;
    slug: string;
  };
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  declined: number;
}

export interface InvitationsResponse {
  invitations: InvitationWithDetails[];
  stats: InvitationStats;
}

export class TenantInvitationsClientAPI {
  private fetchClient: ApiClient;
  private tenantSlug: string;

  constructor(fetchClient: ApiClient, tenantSlug: string) {
    this.fetchClient = fetchClient;
    this.tenantSlug = tenantSlug;
  }

  /**
   * List all invitations for the tenant
   */
  async listInvitations(): Promise<ApiResponse<InvitationsResponse>> {
    const response = await this.fetchClient.get(
      `/tenants/${this.tenantSlug}/invitations`
    );
    return response as ApiResponse<InvitationsResponse>;
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(
    invitationId: string
  ): Promise<
    ApiResponse<{ invitation: Tables<"tenant_invitations">; message: string }>
  > {
    const response = await this.fetchClient.post(
      `/tenants/${this.tenantSlug}/invitations/${invitationId}`,
      { action: "resend" }
    );
    return response as ApiResponse<{
      invitation: Tables<"tenant_invitations">;
      message: string;
    }>;
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(
    invitationId: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.fetchClient.delete(
      `/tenants/${this.tenantSlug}/invitations/${invitationId}`
    );
    return response as ApiResponse<{ success: boolean; message: string }>;
  }
}
