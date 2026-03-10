import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { tenants } from "../platform/schema";
import { memberProfiles, orgUnits } from "../permissions/schema";
import { people, companies } from "../ledger/schema";

export const packages = pgSchema("packages");

/* =========================
   WORKSPACE THREADS
========================= */

export const workspaceThreads = packages.table(
  "workspace_threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    externalThreadId: text("external_thread_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("workspace_threads_tenant_id_idx").on(t.tenantId),
    uniqueIndex("workspace_threads_tenant_external_unique").on(
      t.tenantId,
      t.externalThreadId,
    ),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "workspace_threads_tenant_id_fkey",
    }).onDelete("cascade"),
  ],
);

/* =========================
   WORKSPACE THREAD ASSIGNMENTS
========================= */

export const workspaceThreadAssignments = packages.table(
  "workspace_thread_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    threadId: uuid("thread_id").notNull(),
    ownerMemberProfileId: uuid("owner_member_profile_id").notNull(),
    ownerOrgUnitId: uuid("owner_org_unit_id"),
    assignedAt: timestamp("assigned_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("workspace_thread_assignments_tenant_id_idx").on(t.tenantId),
    index("workspace_thread_assignments_owner_member_idx").on(
      t.ownerMemberProfileId,
    ),
    index("workspace_thread_assignments_owner_org_idx").on(t.ownerOrgUnitId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "workspace_thread_assignments_tenant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.threadId],
      foreignColumns: [workspaceThreads.id],
      name: "workspace_thread_assignments_thread_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.ownerMemberProfileId],
      foreignColumns: [memberProfiles.id],
      name: "workspace_thread_assignments_owner_member_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.ownerOrgUnitId],
      foreignColumns: [orgUnits.id],
      name: "workspace_thread_assignments_owner_org_fkey",
    }).onDelete("set null"),
  ],
);

/* =========================
   WORKSPACE PERSON PROFILES
   Package-owned projection state for people: owner, status, VIP.
========================= */

export const workspacePersonProfiles = packages.table(
  "workspace_person_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    personId: uuid("person_id").notNull(),
    ownerMemberProfileId: uuid("owner_member_profile_id"),
    ownerOrgUnitId: uuid("owner_org_unit_id"),
    status: text("status"),
    isVip: boolean("is_vip").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index("workspace_person_profiles_tenant_id_idx").on(t.tenantId),
    uniqueIndex("workspace_person_profiles_tenant_person_unique").on(
      t.tenantId,
      t.personId,
    ),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "workspace_person_profiles_tenant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.personId],
      foreignColumns: [people.id],
      name: "workspace_person_profiles_person_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.ownerMemberProfileId],
      foreignColumns: [memberProfiles.id],
      name: "workspace_person_profiles_owner_member_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [t.ownerOrgUnitId],
      foreignColumns: [orgUnits.id],
      name: "workspace_person_profiles_owner_org_fkey",
    }).onDelete("set null"),
  ],
);

/* =========================
   WORKSPACE COMPANY PROFILES
   Package-owned projection state for companies: owner, status.
========================= */

export const workspaceCompanyProfiles = packages.table(
  "workspace_company_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    companyId: uuid("company_id").notNull(),
    ownerMemberProfileId: uuid("owner_member_profile_id"),
    ownerOrgUnitId: uuid("owner_org_unit_id"),
    status: text("status"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index("workspace_company_profiles_tenant_id_idx").on(t.tenantId),
    uniqueIndex("workspace_company_profiles_tenant_company_unique").on(
      t.tenantId,
      t.companyId,
    ),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "workspace_company_profiles_tenant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.companyId],
      foreignColumns: [companies.id],
      name: "workspace_company_profiles_company_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.ownerMemberProfileId],
      foreignColumns: [memberProfiles.id],
      name: "workspace_company_profiles_owner_member_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [t.ownerOrgUnitId],
      foreignColumns: [orgUnits.id],
      name: "workspace_company_profiles_owner_org_fkey",
    }).onDelete("set null"),
  ],
);
