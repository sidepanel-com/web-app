# SidePanel Architecture – Layer Model (v1)

This document defines the structural boundaries of SidePanel.  
All schema, API, automation, and package development must respect these layers.

SidePanel separates:

**Reality**  
from  
**Business Interpretation**

The ledger is stable.  
Packages evolve.

# 1️⃣ Platform Layer

**Definition**  
Global system access, authentication, and tenancy.

**Owns**

- tenants
- system-level access
- auth mappings
- global configuration

**Rules**

- Does not contain business logic.
- Does not contain comms.
- Does not contain projection state.
- Is not modified by product packages.

**Answers**

> Who can access the system?

# 2️⃣ Ledger Layer (Product Reality)

**Definition**  
The canonical record of real-world communications and identities.

This is the foundation of the system.

**Owns**

- people
- companies
- comms
- activities
- canonical enums (e.g. `comm_type`)
- identity records

All tables include `tenantId`.

**Rules**

- No CRM concepts.
- No opportunity logic.
- No workflow state.
- No UI-specific shortcuts.
- No projection-specific fields.
- No silent mutation of history.

Ledger is authoritative.

**Answers**

> What actually happened?

# 3️⃣ Temporal Model (Inside Ledger)

**Definition**  
Time-aware identity resolution.

Temporal means relationships are valid only during a specific time range.

**Fields**

- `startAt`
- `endAt`

Used in:

- `people_companies`
- `comms_people`
- other identity relationship tables

**Rules**

- Relationships must not overlap for the same identity context.
- Corrections are handled via close + insert.
- Historical meaning must not be silently rewritten.

**Answers**

> Who represented whom at the time of the event?

Not:

> Who represents them now?

# 4️⃣ Activity Layer (Timeline Abstraction)

**Definition**  
A normalized chronological stream of events.

Activities reference reality.  
They are not business objects.

**Two Categories**

### Communication Activity

- Linked to `comm`
- Represents real-world communication

### Operational Activity

- Linked to `actor`
- Represents internal system or user action

**Rules**

- Activities do not contain business meaning.
- Activities do not store projection state.
- Activities must include actor context.

**Answers**

> What happened and when?

Not:

- Why it matters
- Who owns it
- What pipeline it belongs to

# 5️⃣ Projection Layer (Packages)

**Definition**  
Contextual interpretations of canonical ledger data.

Examples:

- Sales
- Projects
- HR
- Legal
- CMS
- Workspace

Packages:

- Do not own communications.
- Do not duplicate ledger data.
- Do not redefine canonical meaning.
- May create their own workflow state.

**Examples**

Opportunity timeline may include:

- communications involving opportunity contacts
- stage changes
- notes

The ledger remains unchanged.

**Answers**

> What is relevant in this business context?

# 6️⃣ Permission Layer

**Definition**  
Controls visibility over projections.

Important:

Ledger data is not directly exposed without contextual filtering.

Permissions apply to:

- projection-level views
- activity filtering
- access rules

**Rules**

- Ledger is authoritative but not globally visible.
- Access control is layered on top of projections.

**Answers**

> Who is allowed to see this event in this context?

# Clean Visual Summary

Platform  
↓  
Ledger (Reality)  
↓  
Temporal Resolution  
↓  
Activities (Timeline)  
↓  
Projection Packages  
↓  
Permission Filtering

# Architectural Philosophy

SidePanel is a communication-first operating system.

- Ledger = system of record.
- Packages = lenses.
- Temporal correctness preserves historical truth.
- Permissions apply to interpretation, not reality.

Every new feature must declare:

- Which layer it belongs to.
- What it owns.
- What it must never modify.

Layer discipline enables long-term velocity.
