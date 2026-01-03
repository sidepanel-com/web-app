import { Tables } from "@/types/database.types";
import { ApiClient, ApiResponse } from "./index";

export class UserTenantsClientAPI {
  private fetchClient: ApiClient;

  constructor(fetchClient: ApiClient) {
    this.fetchClient = fetchClient;
  }

  async createTenant(tenantName: string) {
    const response = await this.fetchClient.post("/user/tenants", {
      name: tenantName,
    });

    return response as ApiResponse<Tables<"tenants">>;
  }

  async getTenants() {
    const response = await this.fetchClient.get("/user/tenants");
    return response as ApiResponse<Tables<"tenants">[]>;
  }
}
