import { Tables } from "@/types/database.types";
import { ApiClient, ApiResponse } from "./index";

type UserRole = Tables<"tenant_users">["role"];
type UserStatus = Tables<"tenant_users">["status"];

export interface TenantUserListItem {
  id: string;
  user_id: string;
  role: UserRole;
  status: UserStatus | null;
  joined_at: string | null;
  invited_by: string | null;
  permissions: any;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email?: string;
}

export interface TenantUserStats {
  total: number;
  active: number;
  pending: number;
  byRole: Record<UserRole, number>;
}

export interface InviteUserRequest {
  email: string;
  role: UserRole;
  message?: string;
}

export interface UpdateUserRequest {
  role?: UserRole;
  status?: UserStatus;
  permissions?: Record<string, any>;
}

export interface TenantUsersResponse {
  users: TenantUserListItem[];
  stats: TenantUserStats;
}

export class TenantUsersClientAPI {
  private fetchClient: ApiClient;
  private tenantSlug: string;

  constructor(fetchClient: ApiClient, tenantSlug: string) {
    this.fetchClient = fetchClient;
    this.tenantSlug = tenantSlug;
  }

  /**
   * List all users in the tenant
   */
  async listUsers(): Promise<ApiResponse<TenantUsersResponse>> {
    const response = await this.fetchClient.get(
      `/tenants/${this.tenantSlug}/users`
    );
    return response as ApiResponse<TenantUsersResponse>;
  }

  /**
   * Invite a new user to the tenant
   */
  async inviteUser(
    inviteData: InviteUserRequest
  ): Promise<
    ApiResponse<{ invitation: Tables<"tenant_invitations">; message: string }>
  > {
    const response = await this.fetchClient.post(
      `/tenants/${this.tenantSlug}/users`,
      inviteData
    );
    return response as ApiResponse<{
      invitation: Tables<"tenant_invitations">;
      message: string;
    }>;
  }

  /**
   * Get a specific user by ID
   */
  async getUser(userId: string): Promise<ApiResponse<Tables<"tenant_users">>> {
    const response = await this.fetchClient.get(
      `/tenants/${this.tenantSlug}/users/${userId}`
    );
    return response as ApiResponse<Tables<"tenant_users">>;
  }

  /**
   * Update a user's role
   */
  async updateUserRole(
    userId: string,
    role: UserRole
  ): Promise<ApiResponse<{ user: Tables<"tenant_users">; message: string }>> {
    const response = await this.fetchClient.patch(
      `/tenants/${this.tenantSlug}/users/${userId}`,
      { role }
    );
    return response as ApiResponse<{
      user: Tables<"tenant_users">;
      message: string;
    }>;
  }

  /**
   * Update a user's status
   */
  async updateUserStatus(
    userId: string,
    status: UserStatus
  ): Promise<ApiResponse<{ user: Tables<"tenant_users">; message: string }>> {
    const response = await this.fetchClient.patch(
      `/tenants/${this.tenantSlug}/users/${userId}`,
      { status }
    );
    return response as ApiResponse<{
      user: Tables<"tenant_users">;
      message: string;
    }>;
  }

  /**
   * Update a user's permissions
   */
  async updateUserPermissions(
    userId: string,
    permissions: Record<string, any>
  ): Promise<ApiResponse<{ user: Tables<"tenant_users">; message: string }>> {
    const response = await this.fetchClient.patch(
      `/tenants/${this.tenantSlug}/users/${userId}`,
      { permissions }
    );
    return response as ApiResponse<{
      user: Tables<"tenant_users">;
      message: string;
    }>;
  }

  /**
   * Update multiple user properties at once
   */
  async updateUser(
    userId: string,
    updateData: UpdateUserRequest
  ): Promise<ApiResponse<{ user: Tables<"tenant_users">; message: string }>> {
    const response = await this.fetchClient.patch(
      `/tenants/${this.tenantSlug}/users/${userId}`,
      updateData
    );
    return response as ApiResponse<{
      user: Tables<"tenant_users">;
      message: string;
    }>;
  }

  /**
   * Remove a user from the tenant
   */
  async removeUser(
    userId: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.fetchClient.delete(
      `/tenants/${this.tenantSlug}/users/${userId}`
    );
    return response as ApiResponse<{ success: boolean; message: string }>;
  }
}
