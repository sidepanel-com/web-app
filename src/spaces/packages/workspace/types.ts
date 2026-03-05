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
} from "@db/ledger/types";

export type { PermissionContext } from "@/spaces/platform/server/base-entity.service";

export type { DrizzleClient } from "@/spaces/platform/server/db";
