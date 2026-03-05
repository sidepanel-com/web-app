# Workspace Package

Thin projection layer for human-facing ledger views. Provides core UI for people, companies, comms, and timeline data from the ledger schema.

## Directory Structure

- `ui/`: Workspace-specific React components.
- `hooks/`: Workspace-specific React hooks.
- `server/`: Workspace-specific server-side logic and services.
- `client-sdk/`: Client-side API wrappers.
- `lib/`: Validation and utility functions.
- `navigation.tsx`: Configuration for workspace menu items in the sidebar.

## Rules for Coding Agents

1. **Navigation**: Add new menu items to `productNavigation` in `navigation.tsx`.
2. **Imports**:
   - Import workspace projection types from `@/spaces/packages/workspace/types` (re-exports ledger types, `PermissionContext`, `DrizzleClient`).
   - Use `@/ui-primitives/ui/*` for shared UI components (buttons, cards, etc.).
   - Use `@/spaces/platform/*` for platform components and contexts.
   - Use `@/spaces/ledger/*` for ledger write operations.
   - Use `@/spaces/permissions/*` for permission-layer services (member context, org units, scope resolution).
   - Do NOT import from `@db/ledger/types` or `@db/platform/schema` directly — use the workspace `types.ts` boundary or the appropriate space.
3. **Context**: Use `usePlatformTenant()` and `usePlatformUser()` from platform contexts to get the current tenant and user info.
4. **Decoupling**: Do NOT modify files in `src/spaces/platform/`. If you need a platform change, request it from the platform team.
5. **No Business Logic**: This package displays ledger reality. Business workflow state belongs in other packages under `src/spaces/packages/`.
6. **Permissions**: Permission UI, hooks, and services live in `src/spaces/permissions/`, not in this package.
