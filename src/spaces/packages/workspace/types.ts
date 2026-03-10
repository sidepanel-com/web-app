/**
 * Workspace projection types.
 *
 * Re-exports ledger and platform types through a single workspace-owned
 * module so that UI, hooks, client-sdk, and server files within the
 * workspace package never import directly from `@db/ledger/*` or
 * `@/spaces/platform/*`.
 */

export type {
  Person,
  NewPerson,
  Company,
  NewCompany,
  CompanyDomain,
  NewCompanyDomain,
  CompanyWebsite,
  NewCompanyWebsite,
  CompanyWithWeb,
  PersonCompany,
  NewPersonCompany,
  Comm,
  NewComm,
  CommPerson,
  NewCommPerson,
  CommCompany,
  NewCommCompany,
  Activity,
  NewActivity,
  Email,
  NewEmail,
  Meeting,
  NewMeeting,
  Call,
  NewCall,
  Message,
  NewMessage,
  EmailComm,
  MeetingComm,
  CallComm,
  MessageComm,
} from "@db/ledger/types";

export type {
  WorkspaceThread,
  NewWorkspaceThread,
  WorkspaceThreadAssignment,
  NewWorkspaceThreadAssignment,
  WorkspacePersonProfile,
  NewWorkspacePersonProfile,
  WorkspaceCompanyProfile,
  NewWorkspaceCompanyProfile,
} from "@db/packages/types";

export type { PermissionContext } from "@/spaces/platform/server/base-entity.service";

export type { DrizzleClient } from "@/spaces/platform/server/db";

/* =========================
   Workspace Activity DTO
   Shared response shape for feed cards, detail views, and list enrichment.
========================= */

export type ActivityType = "email" | "meeting" | "call" | "message";

export interface ActivityPersonRef {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

export interface ActivityCompanyRef {
  id: string;
  name: string;
}

export interface ActivityDTO {
  id: string;
  type: ActivityType;
  title: string;
  snippet: string | null;
  occurredAt: string;
  accessLevel: string;
  person: ActivityPersonRef | null;
  company: ActivityCompanyRef | null;
  sourceId: string | null;
  metadata: unknown;
}

export interface ActivityDetailDTO extends ActivityDTO {
  source: EmailSourceDTO | MeetingSourceDTO | CallSourceDTO | MessageSourceDTO | null;
}

export interface EmailSourceDTO {
  kind: "email";
  id: string;
  subject: string | null;
  body: string | null;
  occurredAt: string;
}

export interface MeetingSourceDTO {
  kind: "meeting";
  id: string;
  title: string | null;
  description: string | null;
  startAt: string;
  endAt: string;
}

export interface CallSourceDTO {
  kind: "call";
  id: string;
  durationSeconds: string | null;
  recordingUrl: string | null;
  occurredAt: string;
}

export interface MessageSourceDTO {
  kind: "message";
  id: string;
  body: string | null;
  occurredAt: string;
}

export interface ActivityFilters {
  type?: ActivityType;
  personId?: string;
  companyId?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedActivities {
  activities: ActivityDTO[];
  total: number;
  limit: number;
  offset: number;
}
