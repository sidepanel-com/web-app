import {
  pgSchema,
  uuid,
  text,
  timestamp,
  foreignKey,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants, userProfiles } from "../platform/schema";

export const integrations = pgSchema("integrations");

export const ingestSource = integrations.enum("ingest_source", [
  "pipedream",
  "native",
]);

export const listenerStatus = integrations.enum("listener_status", [
  "active",
  "error",
  "expired",
  "disabled",
]);

/* =========================
   CONNECTIONS
========================= */

export const connectionProvider = integrations.enum("connection_provider", [
  "google",
  "slack",
  "quickbooks",
  "outlook",
  "twilio",
  "recall_ai",
  "whatsapp",
]);

export const connectionStatus = integrations.enum("connection_status", [
  "active",
  "error",
  "expired",
  "disconnected",
]);

export const connections = integrations.table(
  "connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    profileId: uuid("profile_id"), // NULL for tenant-owned connections
    provider: connectionProvider("provider").notNull(),
    externalId: text("external_id"), // e.g., email or external org id
    status: connectionStatus("status").default("active").notNull(),
    enabledCapabilities: jsonb("enabled_capabilities")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(), // ['sync_inbox', 'send_email']
    credentials: jsonb("credentials").notNull(), // encrypted tokens
    settings: jsonb("settings")
      .default(sql`'{}'::jsonb`)
      .notNull(), // provider-specific config
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index("connections_tenant_id_idx").on(t.tenantId),
    index("connections_profile_id_idx").on(t.profileId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "connections_tenant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.profileId],
      foreignColumns: [userProfiles.id],
      name: "connections_profile_id_fkey",
    }).onDelete("cascade"),
    // Unique for tenant-owned connections (where profile_id is null)
    uniqueIndex("connections_tenant_provider_unique")
      .on(t.tenantId, t.provider)
      .where(sql`${t.profileId} IS NULL`),
    // Unique for user-owned connections
    uniqueIndex("connections_tenant_profile_provider_unique")
      .on(t.tenantId, t.profileId, t.provider)
      .where(sql`${t.profileId} IS NOT NULL`),
  ]
);

/* =========================
   LISTENERS
========================= */

export const listeners = integrations.table(
  "listeners",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id").notNull(),
    connectionId: uuid("connection_id").notNull(),

    provider: connectionProvider("provider").notNull(), // google
    service: text("service").notNull(), // gmail, calendar
    resourceType: text("resource_type").notNull(), // email, event

    ingestSource: ingestSource("ingest_source").notNull(), // pipedream | native
    providerListenerId: text("provider_listener_id"), // sc_*, watch id, sub id

    status: listenerStatus("status").default("active").notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }),

    lastEventAt: timestamp("last_event_at", {
      withTimezone: true,
      mode: "string",
    }),

    config: jsonb("config")
      .default(sql`'{}'::jsonb`)
      .notNull(),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index("listeners_tenant_id_idx").on(t.tenantId),
    index("listeners_connection_id_idx").on(t.connectionId),
    index("listeners_status_idx").on(t.status),
    index("listeners_expires_at_idx").on(t.expiresAt),

    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "listeners_tenant_id_fkey",
    }).onDelete("cascade"),

    foreignKey({
      columns: [t.connectionId],
      foreignColumns: [connections.id],
      name: "listeners_connection_id_fkey",
    }).onDelete("cascade"),

    // One active listener per connection + service + resource
    uniqueIndex("listeners_connection_service_resource_unique")
      .on(t.connectionId, t.service, t.resourceType)
      .where(sql`${t.status} = 'active'`),
  ]
);

/* =========================
   SYNC STATE
========================= */

export const syncState = integrations.table(
  "sync_state",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    connectionId: uuid("connection_id").notNull(),
    resourceType: text("resource_type").notNull(), // 'emails', 'calendar', 'messages'
    cursor: text("cursor"), // provider-specific sync token
    lastSyncedAt: timestamp("last_synced_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index("sync_state_connection_id_idx").on(t.connectionId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "sync_state_tenant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.connectionId],
      foreignColumns: [connections.id],
      name: "sync_state_connection_id_fkey",
    }).onDelete("cascade"),
    uniqueIndex("sync_state_connection_resource_unique").on(
      t.connectionId,
      t.resourceType
    ),
  ]
);

/* =========================
   RAW RECORDS (The Buffer)
========================= */

export const rawRecordStatus = integrations.enum("raw_record_status", [
  "pending",
  "processed",
  "failed",
]);

export const rawRecords = integrations.table(
  "raw_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    listenerId: uuid("listener_id"),
    ingestSource: ingestSource("ingest_source").notNull(),
    connectionId: uuid("connection_id").notNull(),
    provider: connectionProvider("provider").notNull(),
    externalId: text("external_id").notNull(), // provider's record ID
    resourceType: text("resource_type").notNull(), // 'email', 'message'
    rawData: jsonb("raw_data").notNull(),
    status: rawRecordStatus("status").default("pending").notNull(),
    processingError: text("processing_error"),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (t) => [
    index("raw_records_tenant_id_idx").on(t.tenantId),
    index("raw_records_connection_id_idx").on(t.connectionId),
    index("raw_records_status_idx").on(t.status),
    index("raw_records_listener_id_idx").on(t.listenerId),
    foreignKey({
      columns: [t.listenerId],
      foreignColumns: [listeners.id],
      name: "raw_records_listener_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "raw_records_tenant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.connectionId],
      foreignColumns: [connections.id],
      name: "raw_records_connection_id_fkey",
    }).onDelete("cascade"),
    uniqueIndex("raw_records_provider_external_id_unique").on(
      t.connectionId,
      t.externalId
    ),
  ]
);
