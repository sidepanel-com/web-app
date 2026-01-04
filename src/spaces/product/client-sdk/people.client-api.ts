import type { ApiClient, ApiResponse } from "@/spaces/platform/client-sdk";
import type {
  Person,
  NewPerson,
  Company,
  NewCompany,
  Comm,
  NewComm,
} from "@db/product/types";

export class PeopleClientAPI {
  private fetchClient: ApiClient;

  constructor(fetchClient: ApiClient, _tenantSlug: string) {
    this.fetchClient = fetchClient;
  }

  async getPeople() {
    const response = await this.fetchClient.get("/v1/people");
    return response as ApiResponse<Person[]>;
  }

  async getPerson(personId: string) {
    const response = await this.fetchClient.get(`/v1/people/${personId}`);
    return response as ApiResponse<Person>;
  }

  async createPerson(
    data: Omit<NewPerson, "id" | "tenantId" | "createdAt" | "updatedAt">
  ) {
    const response = await this.fetchClient.post("/v1/people", data);
    return response as ApiResponse<Person>;
  }

  async updatePerson(
    personId: string,
    data: Partial<Omit<Person, "id" | "tenantId" | "createdAt" | "updatedAt">>
  ) {
    const response = await this.fetchClient.patch(
      `/v1/people/${personId}`,
      data
    );
    return response as ApiResponse<Person>;
  }

  async deletePerson(personId: string) {
    const response = await this.fetchClient.delete(`/v1/people/${personId}`);
    return response as ApiResponse<{ success: boolean }>;
  }

  /* =========================
     ASSOCIATIONS (COMPANIES)
  ========================= */

  async addCompany(
    personId: string,
    companyId: string,
    role?: string,
    isPrimary?: boolean
  ) {
    const response = await this.fetchClient.post(
      `/v1/people/${personId}/companies`,
      { companyId, role, isPrimary }
    );
    return response as ApiResponse<{ success: boolean }>;
  }

  async createNewCompany(
    personId: string,
    data: Omit<NewCompany, "id" | "tenantId" | "createdAt" | "updatedAt">,
    role?: string,
    isPrimary?: boolean
  ) {
    const response = await this.fetchClient.post(
      `/v1/people/${personId}/companies`,
      { ...data, role, isPrimary }
    );
    return response as ApiResponse<Company>;
  }

  async removeCompany(personId: string, companyId: string) {
    const response = await this.fetchClient.delete(
      `/v1/people/${personId}/companies`,
      { params: { companyId } }
    );
    return response as ApiResponse<{ success: boolean }>;
  }

  /* =========================
     ASSOCIATIONS (COMMS)
  ========================= */

  async addComm(personId: string, commId: string) {
    const response = await this.fetchClient.post(
      `/v1/people/${personId}/comms`,
      { commId }
    );
    return response as ApiResponse<{ success: boolean }>;
  }

  async createNewComm(
    personId: string,
    data: Omit<NewComm, "id" | "tenantId" | "createdAt" | "updatedAt">
  ) {
    const response = await this.fetchClient.post(
      `/v1/people/${personId}/comms`,
      data
    );
    return response as ApiResponse<Comm>;
  }

  async removeComm(personId: string, commId: string) {
    const response = await this.fetchClient.delete(
      `/v1/people/${personId}/comms`,
      { params: { commId } }
    );
    return response as ApiResponse<{ success: boolean }>;
  }
}
