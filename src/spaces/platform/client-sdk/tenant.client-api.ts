
import { ApiClient, ApiResponse } from "./index";

export class TenantClientAPI {
  private fetchClient: ApiClient;
  private tenantSlug: string;

  constructor(fetchClient: ApiClient, tenantSlug: string) {
    this.fetchClient = fetchClient;
    this.tenantSlug = tenantSlug;
  }

  async getTenant() {
    const response = await this.fetchClient.get(`/tenants/${this.tenantSlug}`);
    return response as ApiResponse<Tables<"tenants">>;
  }

  // Tenant Admin Only
  async updateTenantName(tenantName: string) {
    const response = await this.fetchClient.patch(
      `/tenants/${this.tenantSlug}`,
      {
        name: tenantName,
      }
    );
    return response as ApiResponse<Tables<"tenants">>;
  }

  // Tenant Admin Only
  async deleteTenant() {
    const response = await this.fetchClient.delete(
      `/tenants/${this.tenantSlug}`
    );
    return response as ApiResponse<{ success: boolean }>;
  }

  // Settings API
  async updateGeneralSettings(settings: { name: string }) {
    const response = await this.fetchClient.patch(
      `/tenants/${this.tenantSlug}/settings-general`,
      settings
    );
    return response as ApiResponse<Tables<"tenants">>;
  }
}
