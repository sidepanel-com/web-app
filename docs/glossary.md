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

A normalized communication identity record. Represents an email address, phone number, LinkedIn profile, or other communication method.

## Activity

A chronological event entry referencing reality. Two types: Communication Activity (linked to a comm) and Operational Activity (an internal system or user action).

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
