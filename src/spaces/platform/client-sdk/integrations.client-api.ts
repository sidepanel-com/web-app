import { ApiClient, ApiResponse } from "./index";
import { IntegrationMethod, IntegrationProvider } from "../../integrations/core/types";

export interface IntegrationListItem {
  id: string;
  provider: IntegrationProvider;
  isActive: boolean;
  providerAccountId?: string;
  method: IntegrationMethod;
}

export class IntegrationsClientAPI {
  private fetchClient: ApiClient;
  private tenantSlug: string;

  constructor(fetchClient: ApiClient, tenantSlug: string) {
    this.fetchClient = fetchClient;
    this.tenantSlug = tenantSlug;
  }

  async listIntegrations() {
    const response = await this.fetchClient.get(`/tenants/${this.tenantSlug}/integrations`);
    return response as ApiResponse<IntegrationListItem[]>;
  }

  async connect(provider: IntegrationProvider, method: IntegrationMethod) {
    const response = await this.fetchClient.post(
      `/tenants/${this.tenantSlug}/integrations`,
      { provider, method }
    );
    return response as ApiResponse<any>;
  }

  async disconnect(provider: IntegrationProvider, method: IntegrationMethod) {
    const response = await this.fetchClient.post(
      `/tenants/${this.tenantSlug}/integrations/disconnect`,
      { provider, method }
    );
    return response as ApiResponse<{ success: boolean }>;
  }

  async finalizeConnection(data: {
    provider: IntegrationProvider;
    method: IntegrationMethod;
    providerAccountId: string;
    connectionData?: any;
  }) {
    const response = await this.fetchClient.post(
      `/tenants/${this.tenantSlug}/integrations/callback`,
      data
    );
    return response as ApiResponse<any>;
  }
}

