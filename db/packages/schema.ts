import {
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
