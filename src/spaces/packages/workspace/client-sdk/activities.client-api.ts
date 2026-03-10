import type { ApiClient, ApiResponse } from "@/spaces/platform/client-sdk";
import type {
  PaginatedActivities,
  ActivityDetailDTO,
  ActivityFilters,
  Activity,
} from "@/spaces/packages/workspace/types";

export interface CreateActivityPayload {
  type: "email" | "meeting" | "call" | "message";
  actorCommId: string;
  actorPersonId?: string;
  occurredAt?: string;
  /** Required for type "email" */
  subject?: string;
  /** Required for type "message" */
  body?: string;
  title?: string;
  description?: string;
  /** Required for type "meeting" */
  startAt?: string;
  /** Required for type "meeting" */
  endAt?: string;
  icalUid?: string;
  ownerCommId?: string;
  durationSeconds?: string;
  participantCommIds?: string[];
}

export class ActivitiesClientAPI {
  private fetchClient: ApiClient;

  constructor(fetchClient: ApiClient, _tenantSlug: string) {
    this.fetchClient = fetchClient;
  }

  async getActivities(filters: ActivityFilters = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.personId) params.set("personId", filters.personId);
    if (filters.companyId) params.set("companyId", filters.companyId);
    if (filters.limit != null) params.set("limit", String(filters.limit));
    if (filters.offset != null) params.set("offset", String(filters.offset));

    const qs = params.toString();
    const path = qs ? `/v1/activities?${qs}` : "/v1/activities";
    const response = await this.fetchClient.get(path);
    return response as ApiResponse<PaginatedActivities>;
  }

  async getActivity(activityId: string) {
    const response = await this.fetchClient.get(
      `/v1/activities/${activityId}`,
    );
    return response as ApiResponse<ActivityDetailDTO>;
  }

  async createActivity(data: CreateActivityPayload) {
    const response = await this.fetchClient.post("/v1/activities", data);
    return response as ApiResponse<Activity>;
  }
}
