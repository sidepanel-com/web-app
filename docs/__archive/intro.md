**Boring Starter Kit — Guardrails by Design**

**Core Rule**
- **Product contributors touch only `public` schema**
- **Engineers touch `app`, `auth`, infra**
- **Clear blast-radius per schema**

---

## Stack (locked)
- Next.js **Pages Router**
- Supabase **Auth only**
- Drizzle ORM
- Postgres schemas: `public`, `app` (+ `auth` managed by Supabase)

---

## Schema Contract

### `public` schema (Product-owned)
**Purpose:** Tenant-level, API-accessible business objects  
**Who:** Non-technical product contributors  
**Rules:**
- CRUD via API keys
- No joins to `app` or `auth`
- No user concepts
- No triggers touching other schemas

**Examples**
- `customers`
- `projects`
- `tasks`
- `custom_objects_*`

---

### `app` schema (Engineer-owned)
**Purpose:** Platform mechanics  
**Who:** You / engineers only  
**Rules:**
- Never exposed via API keys
- Accessed only by private server APIs
- Can reference `public` via IDs (one-way)

**Contains**
- Tenants
- Users ↔ tenants
- RBAC
- Invitations
- API keys
- Audit logs
- Sync state
- Billing
- Feature flags

---

### `auth` schema (Supabase-owned)
**Purpose:** Authentication only  
**Rules:**
- No FK coupling
- Treated as external identity provider
- Snapshot data copied into `app`

---

## Access Model

| Layer | Access |
|---|---|
| UI (product-built) | Public API only |
| Public API | `public` schema |
| Private API | `app` + `public` |
| Supabase | Auth only |

---

## Guardrails (non-negotiable)

- **API keys are tenant-scoped → `public` only**
- **RLS enforced on `public`**
- **No cross-schema writes from `public`**
- **Drizzle migrations split by schema**
- **Folder structure mirrors schema ownership**

```
/db
  /public   ← product-safe
  /app      ← engineer-only
```

---

## Mental Model (simple)
- `public` = **what customers build on**
- `app` = **how the platform works**
- `auth` = **who someone is**

That’s it.