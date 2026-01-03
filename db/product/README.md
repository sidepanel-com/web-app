# Product Schema

This directory is for product-specific database schemas. The platform schema is managed in `db/platform/` and should not be touched by the product team.

## Rules for Coding Agents

1. **Schema Definition**: All tables MUST be defined in the `product` schema using `pgSchema('product')`.
2. **Naming**: Use descriptive names for tables and columns.
3. **Tenant Context**: All product tables should include a `tenantId` column of type `uuid` and a foreign key to `platform.tenants(id)`.
4. **Relations**: Define relations in `db/product/relations.ts`.
5. **Types**: Add Select/Insert types in `db/product/types.ts`.
6. **Migrations**: Run `npm run db:generate` after making schema changes to generate a new migration in `supabase/migrations/`.

## Example Table

```typescript
export const items = product.table('items', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (t) => ([
    foreignKey({
        columns: [t.tenantId],
        foreignColumns: [tenants.id],
        name: 'items_tenant_id_fkey'
    }).onDelete('cascade'),
]));
```

