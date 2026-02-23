# Glossary

This glossary defines canonical terminology used across SidePanel.  
All documentation, code, and LLM prompts should use these terms consistently.

## Platform

**Platform Layer**  
Global system access, authentication, and tenancy.  
Owns tenants and system-level access.  
Does not contain business logic.

## Tenant

A logical container representing an isolated customer environment.  
All ledger and package data is scoped by `tenantId`.

## Ledger

**Ledger (Product Reality Layer)**  
The canonical record of real-world communications and identities.

Answers:  
**What actually happened?**

Owns:

- people
- companies
- comms
- activities
- temporal identity relationships

Contains no business workflow state.

## Comm

A normalized communication record.  
Represents email, call, meeting, message, etc.

A comm is canonical reality.  
It is never owned by a package.

## Activity

A chronological event entry referencing reality.

Two types:

- Communication Activity (linked to comm)
- Operational Activity (internal action)

Activities do not contain business meaning.  
They represent timeline events only.

## Temporal

Time-aware identity resolution.

Temporal means relationships are valid only during a defined time range.

Fields:

- `startAt`
- `endAt`

Temporal correctness ensures identity is resolved at the time the event occurred, not based on current state.

## Projection

A contextual interpretation of ledger data.

Examples:

- Sales
- Projects
- HR
- CMS

Packages filter and interpret ledger data but do not mutate its meaning.

## Package

A business-specific module that interprets ledger data.

Packages:

- Do not duplicate canonical data
- Do not redefine comm semantics
- Own their own workflow state

## Workspace

A thin projection layer that provides human-facing views of ledger data.

Workspace organizes communications without introducing business workflow state.

## Actor

The originator of a mutation or activity.

Actor types:

- person
- system
- integration

All assignable or auditable actions must occur within actor context.

## Request Context

The structured metadata attached to every mutation.

Includes:

- tenantId
- actor
- requestId
- origin
- optional batchId

Ensures deterministic and auditable writes.

## Automation

A rule-based or event-driven system that reacts to ledger events.

Automation:

- May create activities
- May create package records
- Must not mutate canonical ledger semantics

## Permission Layer

Controls visibility over projections.

Reality (ledger) is not directly exposed.  
Permissions apply to projections and activity filtering.

## Canonical

Refers to objective, authoritative system truth.

Ledger data is canonical.  
Package data is interpretive.

## Business State

Workflow or contextual interpretation applied by a package.

Examples:

- opportunity stage
- task status
- publish state

Business state does not belong in the ledger.

## Temporal Correctness

The guarantee that identity and relationships are resolved according to their valid time window.

Historical events must not be reinterpreted based on current identity state.

## Mutation Discipline

The rule that:

- Ledger history is not silently rewritten.
- Temporal rows are closed, not overwritten.
- Corrections are explicit and auditable.

---

This glossary defines the shared language of SidePanel.
