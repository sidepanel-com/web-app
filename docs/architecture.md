# Architecture

SidePanel is a tenant-scoped, communication-first operating system.

It separates **reality** from **business interpretation**. The ledger captures what actually happened. Packages interpret what it means in a business context. The ledger is stable. Packages evolve.

**Stack:** Next.js (Pages Router), Drizzle ORM, Supabase (Auth only), PostgreSQL

---

## Layer Model

```
Platform
   ↓
Product Reality (Ledger)
   ↓
Temporal Resolution
   ↓
Activities (Timeline)
   ↓
Projection Packages
   ↓
Permission Filtering (Org Structure + Scope Resolution)
```

---

## 1. Platform Layer

Global system access, auth, and tenancy.

Lives in: `db/platform/`

**Owns:** tenants, auth, system-level access

**Answers:** Who can access the system?

Product team does not modify this layer.

---

## 2. Product Reality Layer (Canonical Ledger)

Immutable record of real-world communications and core identities. This is the foundation.

Lives in: `db/ledger/`

**Owns:** people, companies, comms, emails, calls, meetings, messages, activities

### Identity Model

The atomic unit of identity is the **comm**. All real-world communication flows through a comm record (email address, phone number, LinkedIn profile, etc.).

A comm may map to:
- 1 person
- Multiple people (shared inbox)
- Temporarily none

People and companies are linked through `people_companies` with temporal fields (`startAt`, `endAt`) to track which company a person represented at a given time.

Comms and people are linked through `comms_people` with temporal fields (`startAt`, `endAt`, `isPrimary`) to handle ownership changes and shared inboxes.

**Rules:**
- All tables include `tenantId`
- No CRM concepts
- No opportunity logic
- No package logic
- No UI shortcuts

**Answers:** What actually happened?

---

## 3. Temporal Relationship Layer

Time-aware identity resolution. A relationship is valid only during a specific time range.

**Example:** Person A worked for Company X from Jan 2020 to June 2023. That relationship must not apply in 2024.

**Fields:** `startAt`, `endAt`

**Used in:** `people_companies`, `comms_people`

**Answers:** Who did this identity represent at the time of the event?

Not: Who do they represent now?

---

## 4. Activity Layer (Timeline Abstraction)

A single unified `activities` table providing a normalized chronological stream of events. Activities are timeline entries referencing reality. They are not business objects.

Each activity has a `type`, a `sourceId` pointing to the domain table (email, meeting, call, message), an `occurredAt` timestamp, an `accessLevel`, and `metadata`.

**Two categories:**
- **Communication Activity** (email, meeting, call, message) — requires `actorCommId`. Actor is the comm with the originating role (from, organizer).
- **Operational Activity** (opportunity_created, stage_changed, note_added, etc.) — requires `actorPersonId`. These are internal product events.

**Hard rule:** Exactly one of `actorCommId` or `actorPersonId` must be populated. Never both null. Never both populated.

**Answers:** What happened and when?

Not: Why it matters. Who owns it. What pipeline it belongs to.

---

## 5. Timeline Resolution

Timelines are derived, not attached directly to a person, company, or opportunity.

Activities are resolved through temporal joins:
- `activities` → domain table (via `sourceId`) → `*_comms` → `comms_people` (temporal filter) → person
- Company at time of event: `people_companies` WHERE `startAt <= occurredAt` AND (`endAt IS NULL` OR `endAt >= occurredAt`)

**Example:** A person works at ContractCo in 2022, then joins YourCo in 2024. A 2022 email from `eli@contractco.com` resolves to ContractCo at event time — not YourCo. No data rewriting required. The temporal joins produce the correct answer.

This preserves historical correctness across identity changes, contractor-to-employee transitions, and shared inbox reassignments.

---

## 6. Projection Layer (Packages)

Contextual interpretations of the canonical ledger.

Lives in: `db/packages/`, `src/spaces/packages/`

**Examples:** Workspace, Sales, Legal, HR, Projects

- Does not own communications
- Does not duplicate events
- Filters and projects reality
- Owns its own workflow state

**Workspace** is the default package — a thin projection that provides human-facing views of ledger data without introducing business workflow state.

**Example:** An opportunity timeline includes communications involving opportunity contacts, stage changes, and notes. The ledger remains unchanged.

**Answers:** What is relevant in this business context?

---

## 7. Permission Layer

Controls visibility over projections. The reality layer is not directly exposed.

Lives in: `db/permissions/`

**Permissions apply at:** projection level, activity filtering, access-level rules

### Member Profiles

A **member profile** is the permission-layer identity. It maps 1:1 to a `platform.tenant_users` record. All projection assignment and scope resolution references member profiles — never tenant users directly.

### Organizational Structure

Org units form a tenant-scoped hierarchical tree (departments, teams, divisions). Each org unit has an optional `parentOrgUnitId` and a materialized `path` for fast subtree filtering.

Member profiles are mapped to one or more org units via `member_profile_org_units`.

**Key rule:** Tenants define structure. Packages define how structure affects visibility.

### Assignment Rule

Assignment must never exist in ledger tables (`people`, `companies`, `comms`, `emails`, `calls`, `meetings`, `messages`, `activities`). Ledger tables must not contain `ownerMemberProfileId`, `assignedTo`, or workflow state.

Assignment belongs only to projection tables. Projection tables may include `ownerMemberProfileId` and `ownerOrgUnitId`.

### Scope Resolver Contract

Every projection package must implement a scope resolver — a deterministic function that converts member context (tenant, member profile, roles, org unit IDs, org unit paths) into query constraints.

Every projection endpoint must:
1. Load request context
2. Resolve scope via the package's resolver
3. Apply tenant + scope constraints
4. Execute query

No projection query may execute without scope resolution.

**Answers:** Who is allowed to see this event in this context?

---

## One-Sentence Reference

| Layer | Definition |
|---|---|
| Platform | Who can access the system |
| Reality | What actually happened |
| Temporal | Who represented whom at that moment in time |
| Activity | Chronological event abstraction |
| Projection | Business interpretation of reality |
| Permission | Who can see which projection, scoped by org structure |
