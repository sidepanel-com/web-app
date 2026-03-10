import { ApiClient, type ApiClientOptions } from "@/spaces/platform/client-sdk";
import { PeopleClientAPI } from "./people.client-api";
import { CompaniesClientAPI } from "./companies.client-api";
import { ActivitiesClientAPI } from "./activities.client-api";
import { ThreadsClientAPI } from "./threads.client-api";

export interface ProductClientSDK {
  people: PeopleClientAPI;
  companies: CompaniesClientAPI;
  activities: ActivitiesClientAPI;
  threads: ThreadsClientAPI;
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
    activities: new ActivitiesClientAPI(client, tenantSlug),
    threads: new ThreadsClientAPI(client, tenantSlug),
  };
}

