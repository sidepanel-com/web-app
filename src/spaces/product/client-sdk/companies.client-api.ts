import type { ApiClient, ApiResponse } from "@/spaces/platform/client-sdk";
import type { Company, NewCompany, Person, NewPerson, Comm, NewComm } from "@db/product/types";

export class CompaniesClientAPI {
  private fetchClient: ApiClient;

  constructor(fetchClient: ApiClient, _tenantSlug: string) {
    this.fetchClient = fetchClient;
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

  /* =========================
     ASSOCIATIONS (PEOPLE)
  ========================= */

  async addPerson(
    companyId: string,
    personId: string,
    role?: string,
    isPrimary?: boolean
  ) {
    const response = await this.fetchClient.post(
      `/v1/companies/${companyId}/people`,
      { personId, role, isPrimary }
    );
    return response as ApiResponse<{ success: boolean }>;
  }

  async createNewPerson(
    companyId: string,
    data: Omit<NewPerson, "id" | "tenantId" | "createdAt" | "updatedAt">,
    role?: string,
    isPrimary?: boolean
  ) {
    const response = await this.fetchClient.post(
      `/v1/companies/${companyId}/people`,
      { ...data, role, isPrimary }
    );
    return response as ApiResponse<Person>;
  }

  async removePerson(companyId: string, personId: string) {
    const response = await this.fetchClient.delete(
      `/v1/companies/${companyId}/people`,
      { params: { personId } }
    );
    return response as ApiResponse<{ success: boolean }>;
  }

  /* =========================
     ASSOCIATIONS (COMMS)
  ========================= */

  async addComm(companyId: string, commId: string) {
    const response = await this.fetchClient.post(
      `/v1/companies/${companyId}/comms`,
      { commId }
    );
    return response as ApiResponse<{ success: boolean }>;
  }

  async createNewComm(
    companyId: string,
    data: Omit<NewComm, "id" | "tenantId" | "createdAt" | "updatedAt">
  ) {
    const response = await this.fetchClient.post(
      `/v1/companies/${companyId}/comms`,
      data
    );
    return response as ApiResponse<Comm>;
  }

  async removeComm(companyId: string, commId: string) {
    const response = await this.fetchClient.delete(
      `/v1/companies/${companyId}/comms`,
      { params: { commId } }
    );
    return response as ApiResponse<{ success: boolean }>;
  }
}

