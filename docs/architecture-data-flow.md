# Architecture: Data Access Flow

Implementation-level view of how projection packages access ledger data and where permission checks occur. For the conceptual layer model, see [architecture.md](architecture.md).

---

## Package Structure

Using Workspace as the reference package:

```
src/spaces/packages/workspace/
├── ui/                          Presentation layer (React components)
│   ├── people/
│   ├── companies/
│   └── settings/
├── hooks/                       Client data layer (React hooks)
│   ├── use-people.ts
│   └── use-companies.ts
├── client-sdk/                  HTTP boundary (fetch wrappers)
│   ├── people.client-api.ts
│   └── companies.client-api.ts
├── types.ts                     Re-exports from @db/ledger/types
├── server/                      Server-side services
│   ├── workspace-service.ts     Base class, creates LedgerWriteService
│   ├── people.service.ts        Reads ledger directly, writes via LedgerWriteService
│   └── companies.service.ts     Same pattern
└── navigation.tsx
```

Supporting files:

```
src/pages/api/v1/               API routes (instantiate services)
src/spaces/ledger/server/
└── ledger-write.service.ts     Central write gateway for all ledger tables
db/ledger/
├── schema.ts                   Canonical tables (people, companies, comms, etc.)
├── types.ts                    Drizzle-inferred types
└── relations.ts                Drizzle relations
```

---

## Data Access Flow

```
UI Components (people-view, companies-list)
    │  types from workspace/types.ts
    ▼
Hooks (use-people, use-companies)
    │  useProductSdk()
    ▼
Client SDK (people.client-api, companies.client-api)
    │  HTTP fetch to /api/v1/*
    ▼
API Routes (src/pages/api/v1/people/*, companies/*)
    │  Service.create(db, userId, tenantId, ...)
    ▼
Package Services (PeopleService, CompaniesService)
    │  extend WorkspaceService
    │
    ├─ READS: this.db.select().from(people)    ← import from @db/ledger/schema
    │         Direct Drizzle queries on ledger tables
    │
    └─ WRITES: this.ledger.insertPerson()      ← LedgerWriteService
               this.ledger.updateCompany()
               Delegated to src/spaces/ledger/server/ledger-write.service.ts
                    │
                    ▼
              db/ledger/schema.ts
              (people, companies, comms, emails, activities, etc.)
```

### Rules

- **Reads are direct.** Package services import table references from `@db/ledger/schema` and query the shared Drizzle client.
- **Writes are centralized.** All mutations go through `LedgerWriteService`, instantiated by `WorkspaceService` (the base class).
- **Types are re-exported.** `workspace/types.ts` re-exports from `@db/ledger/types`. UI, hooks, and client-sdk import from the package — never from `db/ledger/` directly.
- **Packages never own ledger data.** They query and project it for their business context. The canonical schema lives entirely in `db/ledger/`.

---

## Permission Check Points

Checks are layered into the request lifecycle. The API service layer handles identity and access. The package service layer handles authorization and scope.

```
API Request (e.g. GET /api/v1/people)
    │
    ▼
API Service Layer (V1ApiService or PathTenantApiService)
src/spaces/platform/server/v1-api-service.ts
    │
    ├─ 1. AUTH ────────── Supabase session or API key
    ├─ 2. TENANT ──────── X-Tenant-Slug header → tenant lookup
    ├─ 3. USER ROLE ───── TenantService.getUserRoleInTenant()
    ├─ 4. API KEY SCOPE ─ getRequiredScopeForRoute() + scopesInclude()
    ├─ 5. PACKAGE GATE ── PackageService.isPackageEnabled()
    ├─ 6. MEMBER CONTEXT  resolveMemberContext(db, tenantId, profileId)
    │     └→ memberProfileId, orgUnitIds, orgUnitPaths
    │
    ▼
Handler receives { db, tenantId, userRole, memberProfileId, orgUnitIds, orgUnitPaths }
    │
    ▼
Package Service (e.g. PeopleService)
src/spaces/packages/workspace/server/people.service.ts
    │
    ├─ 7. ROLE-BASED CRUD ── hasPermission("create" | "update" | "delete")
    │     owner/admin → full access
    │     member     → create, update, read
    │     viewer     → read only
    │
    ├─ 8. SCOPE RESOLUTION ─ getScope() → resolveWorkspaceScope(permissionContext)
    │     Returns ScopeConstraints { restricted, memberProfileId, orgUnitIds, orgUnitPaths }
    │
    ▼
Ledger Query
    └─ .where(eq(people.tenantId, tenantId))
       Scope constraints available but not yet applied to WHERE clauses
```

### Member Context Resolution

`resolveMemberContext` (`src/spaces/permissions/server/member-context.ts`) loads the permission identity for the request:

1. Finds `tenant_users` by `tenantId` + `profileId`
2. Finds `member_profiles` by `tenantUserId` + `tenantId`
3. Joins `member_profile_org_units` + `org_units` for org unit IDs and materialized paths

### Scope Resolver

`resolveWorkspaceScope` (`src/spaces/permissions/server/scope-resolver.ts`) converts member context into query constraints. Per the architecture contract, every package must implement its own scope resolver.

Currently `restricted` is `false` — queries only filter by `tenantId`. When enabled, scope constraints will narrow results based on org-unit membership.

### Check Summary

| Check | Where | Status |
|---|---|---|
| Authentication | API Service layer (platform) | Active |
| Tenant access | API Service layer (platform) | Active |
| API key scope | API Service layer (platform) | Active |
| Package enablement | API Service layer (platform) | Active |
| Role-based CRUD | WorkspaceService.hasPermission() | Active |
| Org-unit data filtering | resolveWorkspaceScope() → query constraints | Plumbed, not enforced |
