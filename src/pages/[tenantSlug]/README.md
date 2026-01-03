# Tenant Pages

This directory contains pages that are rendered within the context of a specific tenant. The `[tenantSlug]` parameter in the URL determines which tenant's data is loaded.

## Rules for Coding Agents

1. **New Pages**: When adding a new product page, create it here (e.g., `src/pages/[tenantSlug]/my-feature.tsx`).
2. **Layout**: Wrap every page in the `<AppPage>` component from `@/spaces/platform/ui/layout/app-page`.
3. **Data Fetching**: 
   - Use `getServerSideProps` with `createClient` from `@/spaces/identity/supabase.server-props` for initial data or auth checks.
   - Use platform hooks for client-side tenant/user data.
4. **Navigation**: Ensure the new page is linked in `src/spaces/product/navigation.tsx`.

## Example Page Structure

```tsx
import { AppPage } from "@/spaces/platform/ui/layout/app-page";

export default function MyFeaturePage() {
  return (
    <AppPage>
      <h1>My Feature</h1>
      {/* ... */}
    </AppPage>
  );
}
```

