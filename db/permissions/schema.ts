import {
  type AnyPgColumn,
  foreignKey,
  index,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { tenants, tenantUsers } from "../platform/schema";

export const permissions = pgSchema("permissions");

/* =========================
   MEMBER PROFILES
   1:1 with platform.tenant_users.
   Permission-layer identity used for
   all assignment and scope resolution.
========================= */

export const memberProfiles = permissions.table(
  "member_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    tenantUserId: uuid("tenant_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("member_profiles_tenant_id_idx").on(t.tenantId),
    uniqueIndex("member_profiles_tenant_user_id_unique").on(t.tenantUserId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "member_profiles_tenant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.tenantUserId],
      foreignColumns: [tenantUsers.id],
      name: "member_profiles_tenant_user_id_fkey",
    }).onDelete("cascade"),
  ],
);

/* =========================
   ORG UNITS
   Hierarchical grouping model.
   Uses materialized path for
   fast subtree filtering.
========================= */

export const orgUnits = permissions.table(
  "org_units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    name: text("name").notNull(),
    parentOrgUnitId: uuid("parent_org_unit_id").references(
      (): AnyPgColumn => orgUnits.id,
    ),
    path: text("path"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("org_units_tenant_id_idx").on(t.tenantId),
    index("org_units_tenant_id_path_idx").on(t.tenantId, t.path),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "org_units_tenant_id_fkey",
    }).onDelete("cascade"),
  ],
);

/* =========================
   MEMBER PROFILE ↔ ORG UNITS
   Many-to-many mapping.
========================= */

export const memberProfileOrgUnits = permissions.table(
  "member_profile_org_units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    memberProfileId: uuid("member_profile_id").notNull(),
    orgUnitId: uuid("org_unit_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("member_profile_org_units_tenant_id_idx").on(t.tenantId),
    index("member_profile_org_units_org_unit_id_idx").on(t.orgUnitId),
    uniqueIndex("member_profile_org_units_member_org_unique").on(
      t.memberProfileId,
      t.orgUnitId,
    ),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "member_profile_org_units_tenant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.memberProfileId],
      foreignColumns: [memberProfiles.id],
      name: "member_profile_org_units_member_profile_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.orgUnitId],
      foreignColumns: [orgUnits.id],
      name: "member_profile_org_units_org_unit_id_fkey",
    }).onDelete("cascade"),
  ],
);
