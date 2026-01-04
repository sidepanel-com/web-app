import { ApiClient, ApiResponse } from "@/spaces/platform/client-sdk";
import { Person, NewPerson } from "@db/product/types";

export class PeopleClientAPI {
  private fetchClient: ApiClient;
  private tenantSlug: string;

  constructor(fetchClient: ApiClient, tenantSlug: string) {
    this.fetchClient = fetchClient;
    this.tenantSlug = tenantSlug;
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
}
