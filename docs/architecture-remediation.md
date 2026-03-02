# Architecture Remediation

Phased plan to bring the codebase into alignment with the [layer model](architecture.md).

Each phase builds on the previous. Phases 0 is independent and can run in parallel with any other phase.

---

## Phase 0 — Quick Wins (done)

Independent fixes with no cross-phase dependencies.

- ~~Add `<AppPage>` wrapper to `invitations.tsx` and `wrapped/index.tsx`~~
- ~~Extract a `useApiKeys` hook from inline fetch calls in `api-keys-settings.tsx`~~
- ~~Move inline business logic out of `api-keys`, `users`, and `integrations` API handlers into services~~
- ~~Standardize error handling across API routes to consistently use `ApiError`~~

---

## Phase 1 — Fix the Identity Layer (done)

Wire member profile identity (`memberProfileId`) and org unit context (`orgUnitIds`, `orgUnitPaths`) into the API service layer.

- ~~Extend `PermissionContext` with `memberProfileId`, `orgUnitIds`, `orgUnitPaths`~~
- ~~Create `resolveMemberContext()` to look up member profile and org unit memberships~~
- ~~Wire the resolver into `V1ApiService` and `PathTenantApiService`~~
- ~~Update service factory methods and all API route call sites~~

---

## Phase 2 — Implement the Scope Resolver (done)

Build the scope resolver contract that converts member context into query constraints.

- ~~Define `ScopeConstraints` type and `resolveWorkspaceScope()` function~~ — `scope-resolver.ts`
- ~~Integrate scope resolution into `PeopleService` and `CompaniesService` query methods~~
- ~~Enforce at the API layer: no projection query runs without scope resolution~~
- ~~Ship with permissive defaults (unrestricted for all roles), then tighten incrementally~~

Shipped with permissive defaults (`restricted: false`). Tightening is a future iteration.

---

## Phase 3 — Isolate Ledger Writes

Extract all write operations to ledger tables into a dedicated ledger service. Projection services currently insert/update/delete directly into `people`, `companies`, `comms`, and junction tables.

**Scope:**

- Create a ledger write service that owns all mutations to ledger tables
- Refactor `PeopleService` and `CompaniesService` to delegate writes to the ledger service
- Remove write-capable ledger schema imports from package services

**Depends on:** Phase 2 (identity and scope model must be solid before restructuring write paths).

---

## Phase 4 — Clean Up Cross-Layer Imports

Remove direct imports that cross layer boundaries.

**Scope:**

- Create workspace projection types that wrap/re-export ledger types
- Replace direct platform schema imports in package services with platform service calls or dependency injection
- Decouple projection services from `BaseEntityService` (create workspace-specific base or use composition)

**Depends on:** Phase 3 (ledger service removes most problematic imports).

---

## Phase 5 — Clean Up the Ledger Schema

Remove CRM and operational activity types from the ledger `activityType` enum.

**Scope:**

- Audit usage of `opportunity_created`, `stage_changed`, `note_added`, `integration_connected`, `ai_summary_generated`, `permission_changed`
- Move operational activity types to a package-level enum in `db/packages/`
- Generate a migration removing invalid values from the ledger enum

**Depends on:** Phase 4 (no code should reference the invalid enum values by this point).

---

## Dependency Graph

```
Phase 0 (Quick Wins)  ─────────────────────────── independent

Phase 1 (Identity) ──▸ Phase 2 (Scope Resolver) ──▸ Phase 3 (Ledger Writes)
                                                           │
                                                           ▼
                                                     Phase 4 (Imports)
                                                           │
                                                           ▼
                                                     Phase 5 (Schema)
```
