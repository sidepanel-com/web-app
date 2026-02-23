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
Permission Filtering
```

---

## 1. Platform Layer

Global system access, auth, and tenancy.

Lives in: `db/platform/`, `src/spaces/platform/`

**Owns:** tenants, auth, system-level access

**Answers:** Who can access the system?

Product team does not modify this layer.

---

## 2. Product Reality Layer (Canonical Ledger)

Immutable record of real-world communications and core identities. This is the foundation.

Lives in: `db/ledger/`, `src/spaces/product/`

**Owns:** people, companies, comms, emails, calls, meetings, messages, activities

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

A normalized chronological stream of events. Activities are timeline entries referencing reality. They are not business objects.

**Two categories:**
- **Communication Activity** — linked via `actorCommId` to email, call, meeting, or message
- **Operational Activity** — linked via `actorPersonId` to internal state changes

**Answers:** What happened and when?

Not: Why it matters. Who owns it. What pipeline it belongs to.

---

## 5. Projection Layer (Packages)

Contextual interpretations of the canonical ledger.

Lives in: `db/packages/`

**Examples:** Sales, Legal, HR, Projects

- Does not own communications
- Does not duplicate events
- Filters and projects reality
- Owns its own workflow state

**Example:** An opportunity timeline includes communications involving opportunity contacts, stage changes, and notes. The ledger remains unchanged.

**Answers:** What is relevant in this business context?

---

## 6. Permission Layer

Controls visibility over projections. The reality layer is not directly exposed.

**Permissions apply at:** projection level, activity filtering, access-level rules

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
| Permission | Who can see which projection |
