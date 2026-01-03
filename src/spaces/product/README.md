# Product Space

This space is for product-specific UI components, hooks, and services. It is decoupled from the `platform` space to allow the product team to move fast without breaking core infrastructure.

## Directory Structure

- `ui/`: Product-specific React components.
- `hooks/`: Product-specific React hooks.
- `server/`: Product-specific server-side logic and services.
- `navigation.tsx`: Configuration for product menu items in the sidebar.

## Rules for Coding Agents

1. **Navigation**: Add new menu items to `productNavigation` in `navigation.tsx`.
2. **Imports**: 
   - Prefer `@/spaces/platform/*` for platform components and contexts.
   - Use `@/ui-primitives/ui/*` for shared UI components (buttons, cards, etc.).
   - Use `@db/product/*` for product database types.
3. **Context**: Use `usePlatformTenant()` and `usePlatformUser()` from platform contexts to get the current tenant and user info.
4. **Decoupling**: Do NOT modify files in `src/spaces/platform/`. If you need a platform change, request it from the platform team.

