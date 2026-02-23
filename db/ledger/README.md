# Ledger Schema

Canonical record of real-world communications and core identities. This is the foundation layer — what actually happened.

## Rules for Coding Agents

1. **Schema Definition**: All tables MUST use `pgSchema('ledger')`.
2. **Tenant Context**: Every table includes a `tenantId` column (`uuid`) with a foreign key to `platform.tenants(id)`.
3. **No Business Logic**: No CRM concepts, no opportunity state, no pipeline stages. Those belong in `db/packages/`.
4. **Temporal Relationships**: `people_companies` and `comms_people` use `startAt` / `endAt` for time-aware identity resolution.
5. **Activities**: The unified `activities` table records timeline events. Each activity must have exactly one of `actorCommId` (communication events) or `actorPersonId` (operational events) — never both, never neither.
6. **Relations**: Define in `db/ledger/relations.ts`.
7. **Types**: Add Select/Insert types in `db/ledger/types.ts`.
8. **Migrations**: Run `npm run db:generate` after schema changes.

## Example Table

```typescript
export const items = ledger.table(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.id],
      name: "items_tenant_id_fkey",
    }).onDelete("cascade"),
  ]
);
```
