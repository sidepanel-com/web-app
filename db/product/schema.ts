import {
  pgSchema,
  uuid,
  text,
  timestamp,
  foreignKey,
  pgEnum,
  jsonb,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "../platform/schema";

export const product = pgSchema("product");

/* =========================
   PEOPLE
========================= */

export const people = product.table(
  "people",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index("people_tenant_id_idx").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "people_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

/* =========================
   COMPANIES
========================= */

export const companies = product.table(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index("companies_tenant_id_idx").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "companies_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const companyDomains = product.table(
  "company_domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    companyId: uuid("company_id").notNull(),
    domain: text("domain").notNull(),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "company_domains_tenant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.companyId],
      foreignColumns: [companies.id],
      name: "company_domains_company_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const companyWebsites = product.table(
  "company_websites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    companyId: uuid("company_id").notNull(),
    url: text("url").notNull(),
    type: text("type"),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "company_websites_tenant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.companyId],
      foreignColumns: [companies.id],
      name: "company_websites_company_id_fkey",
    }).onDelete("cascade"),
  ]
);

/* =========================
   PEOPLE ↔ COMPANIES
========================= */

export const peopleCompanies = product.table(
  "people_companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    personId: uuid("person_id").notNull(),
    companyId: uuid("company_id").notNull(),
    role: text("role"),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("people_companies_tenant_id_idx").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "people_companies_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

/* =========================
   COMMS
========================= */

export const commType = pgEnum("comm_type", [
  "email",
  "phone",
  "linkedin",
  "slack",
  "whatsapp",
  "other",
]);

export const comms = product.table(
  "comms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    type: commType("type").notNull(),
    value: jsonb("value").notNull(),
    canonicalValue: text("canonical_value").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("comms_tenant_id_idx").on(t.tenantId),
    uniqueIndex("comms_tenant_type_canonical_value_unique").on(
      t.tenantId,
      t.type,
      t.canonicalValue
    ),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "comms_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

/* =========================
   COMMS ↔ PEOPLE / COMPANIES
========================= */

export const commsPeople = product.table(
  "comms_people",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    commId: uuid("comm_id").notNull(),
    personId: uuid("person_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("comms_people_tenant_id_idx").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "comms_people_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const commsCompanies = product.table(
  "comms_companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    commId: uuid("comm_id").notNull(),
    companyId: uuid("company_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("comms_companies_tenant_id_idx").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "comms_companies_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

/* =========================
   EMAILS
========================= */

export const emails = product.table(
  "emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    externalId: text("external_id"),
    subject: text("subject"),
    body: text("body"),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("emails_tenant_id_idx").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "emails_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const emailComms = product.table(
  "email_comms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    emailId: uuid("email_id").notNull(),
    commId: uuid("comm_id").notNull(),
    role: text("role"), // from | to | cc | bcc
  },
  (t) => [
    index("email_comms_tenant_id_idx").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "email_comms_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

/* =========================
   MEETINGS (DEDUPED)
========================= */

export const meetings = product.table(
  "meetings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    icalUid: text("ical_uid").notNull(),
    ownerCommId: uuid("owner_comm_id").notNull(),
    title: text("title"),
    description: text("description"),
    startAt: timestamp("start_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    endAt: timestamp("end_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    recordingUrl: text("recording_url"),
    transcriptUrl: text("transcript_url"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("meetings_tenant_id_idx").on(t.tenantId),
    uniqueIndex("meetings_tenant_ical_uid_unique").on(t.tenantId, t.icalUid),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "meetings_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const meetingsComms = product.table(
  "meetings_comms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    meetingId: uuid("meeting_id").notNull(),
    commId: uuid("comm_id").notNull(),
    role: text("role"), // organizer | attendee
    responseStatus: text("response_status"),
  },
  (t) => [
    index("meetings_comms_tenant_id_idx").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "meetings_comms_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

/* =========================
   CALLS
========================= */

export const calls = product.table(
  "calls",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    externalId: text("external_id"),
    durationSeconds: text("duration_seconds"),
    recordingUrl: text("recording_url"),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("calls_tenant_id_idx").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "calls_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const callComms = product.table(
  "call_comms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    callId: uuid("call_id").notNull(),
    commId: uuid("comm_id").notNull(),
    role: text("role"), // from | to
  },
  (t) => [
    index("call_comms_tenant_id_idx").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "call_comms_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

/* =========================
   MESSAGES
========================= */

export const messages = product.table(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    externalId: text("external_id"),
    body: text("body"),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("messages_tenant_id_idx").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "messages_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const messageComms = product.table(
  "message_comms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    messageId: uuid("message_id").notNull(),
    commId: uuid("comm_id").notNull(),
    role: text("role"), // from | to
  },
  (t) => [
    index("message_comms_tenant_id_idx").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "message_comms_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);
