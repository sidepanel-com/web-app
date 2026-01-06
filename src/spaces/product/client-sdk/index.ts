import { ApiClient, ApiClientOptions, ApiResponse } from "@/spaces/platform/client-sdk";
import { PeopleClientAPI } from "./people.client-api";
import { CompaniesClientAPI } from "./companies.client-api";

export interface ProductClientSDK {
  people: PeopleClientAPI;
  companies: CompaniesClientAPI;
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
    companies: new CompaniesClientAPI(client, tenantSlug),
  };
}

