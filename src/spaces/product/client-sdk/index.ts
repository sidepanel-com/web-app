import { ApiClient, ApiClientOptions, ApiResponse } from "@/spaces/platform/client-sdk";
import { PeopleClientAPI } from "./people.client-api";

export interface ProductClientSDK {
  people: PeopleClientAPI;
  // Future: companies: CompaniesClientAPI;
}

export function createProductClientSDK(
  options: ApiClientOptions,
  tenantSlug: string
): ProductClientSDK {
  const client = new ApiClient({
    ...options,
    tenantSlug,
  });

  return {
    people: new PeopleClientAPI(client, tenantSlug),
  };
}

