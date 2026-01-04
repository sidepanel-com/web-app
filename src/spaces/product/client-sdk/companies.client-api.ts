import { ApiClient, ApiResponse } from "@/spaces/platform/client-sdk";
import { Company, NewCompany } from "@db/product/types";

export class CompaniesClientAPI {
  private fetchClient: ApiClient;
  private tenantSlug: string;

  constructor(fetchClient: ApiClient, tenantSlug: string) {
    this.fetchClient = fetchClient;
    this.tenantSlug = tenantSlug;
  }

  async getCompanies() {
    const response = await this.fetchClient.get("/v1/companies");
    return response as ApiResponse<Company[]>;
  }

  async getCompany(companyId: string) {
    const response = await this.fetchClient.get(`/v1/companies/${companyId}`);
    return response as ApiResponse<Company>;
  }

  async createCompany(
    data: Omit<NewCompany, "id" | "tenantId" | "createdAt" | "updatedAt">
  ) {
    const response = await this.fetchClient.post("/v1/companies", data);
    return response as ApiResponse<Company>;
  }

  async updateCompany(
    companyId: string,
    data: Partial<Omit<Company, "id" | "tenantId" | "createdAt" | "updatedAt">>
  ) {
    const response = await this.fetchClient.patch(
      `/v1/companies/${companyId}`,
      data
    );
    return response as ApiResponse<Company>;
  }

  async deleteCompany(companyId: string) {
    const response = await this.fetchClient.delete(`/v1/companies/${companyId}`);
    return response as ApiResponse<{ success: boolean }>;
  }
}

