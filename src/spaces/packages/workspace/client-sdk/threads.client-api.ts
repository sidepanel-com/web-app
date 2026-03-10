import type { ApiClient, ApiResponse } from "@/spaces/platform/client-sdk";
import type { ThreadDTO } from "@/spaces/packages/workspace/server/threads.service";

export class ThreadsClientAPI {
  private fetchClient: ApiClient;

  constructor(fetchClient: ApiClient, _tenantSlug: string) {
    this.fetchClient = fetchClient;
  }

  async getThreadForPerson(personId: string) {
    const response = await this.fetchClient.get(
      `/v1/threads/${personId}`,
    );
    return response as ApiResponse<ThreadDTO>;
  }
}
