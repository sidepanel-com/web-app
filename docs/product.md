# Product Overview — CRM Core

This product is a **communication-first CRM**.

It tracks **who**, **where**, and **how** communication happens, while preserving durable CRM structure.

---

## Core Objects

- `people`
- `companies`
- `comms` (communication identifiers)

---

## Relationship Model

- `comms_people`
- `comms_companies`
- `people_companies`

**Rules**

- Org structure lives in `people_companies`
- Communication identity lives in `comms`
- Activities never link directly to people or companies

---

## Activity Channels

Each channel is explicit.

- `emails`
- `meetings`
- `calls`
- `messages`

**Rules**

- All activities reference `comm_id`
- All activities have `occurred_at`
- Recordings are fields, not tables
- New channel = new table

---

## Timeline

- No `timeline` table
- Timeline is a derived UNION view over activity tables
- Sorted by `occurred_at`

---

## Core UX Capabilities

- **Recent Conversations**

  - Driven by activity tables
  - Grouped by `comm_id`

- **Person View**

  - Companies via `people_companies`
  - Activity via `comms_people`

- **Company View**
  - People via `people_companies`
  - Activity via `comms_companies`

---

## Non-Goals

- No polymorphic activity table
- No implicit relationships from activity alone
- No schema mutation by agents

---

## Design Goal

Stable identity.  
Explicit channels.  
Derived views.  
Zero schema churn.
