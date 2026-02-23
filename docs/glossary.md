# Glossary

Canonical terminology used across SidePanel. All documentation, code, and agent prompts should use these terms consistently.

For system structure see [architecture.md](architecture.md).

---

## Platform

The global system layer. Handles authentication, tenancy, and system-level access.

## Tenant

A logical container representing an isolated customer environment. All ledger and package data is scoped by `tenantId`.

## Ledger

The canonical record of real-world communications and identities. The foundation of the product layer. Owns people, companies, comms, and activities.

## Comm

The atomic unit of identity in SidePanel. A normalized communication record representing a single communication method (email address, phone number, LinkedIn profile, etc.). A comm may map to one person, multiple people (shared inbox), or temporarily none.

## Activity

A chronological event entry in the unified `activities` table. Each activity has a `type` and a `sourceId` linking to its domain table (email, meeting, call, message). Two categories: Communication Activity (linked via `actorCommId`) and Operational Activity (linked via `actorPersonId`).

## Temporal

Time-aware identity resolution. A temporal relationship is valid only during a defined time range (`startAt` / `endAt`). Identity is resolved at the time the event occurred, not based on current state.

## Temporal Correctness

The guarantee that identity and relationships are resolved according to their valid time window. Historical events are not reinterpreted based on current identity state.

## Projection

A contextual interpretation of ledger data. Examples: Sales, HR, Legal, Projects. Projections filter and interpret reality without mutating it.

## Package

A business-specific module that interprets ledger data. Packages own their own workflow state.

## Workspace

A thin projection layer that provides human-facing views of ledger data. Organizes communications without introducing business workflow state.

## Actor

The originator of a mutation or activity. Types: person, system, integration.

## Request Context

Structured metadata attached to every mutation. Includes `tenantId`, `actor`, `requestId`, `origin`, and optional `batchId`.

## Automation

A rule-based or event-driven system that reacts to ledger events. May create activities and package records.

## Canonical

Objective, authoritative system truth. Ledger data is canonical. Package data is interpretive.

## Business State

Workflow or contextual interpretation applied by a package. Examples: opportunity stage, task status, publish state.

## Mutation Discipline

The principle that ledger history is not silently rewritten. Temporal rows are closed, not overwritten. Corrections are explicit and auditable.

## Member Profile

Permission-layer identity. Maps 1:1 to a `platform.tenant_users` record. All projection assignment and scope resolution uses member profiles, not tenant users directly.

## Org Unit

A tenant-scoped hierarchical grouping (department, team, division). Org units form a tree via `parentOrgUnitId` and use a materialized `path` for fast subtree filtering.

## Scope Resolver

A deterministic function that each projection package implements to convert member context (tenant, member profile, roles, org unit IDs, org unit paths) into database query constraints. No projection query executes without scope resolution.
