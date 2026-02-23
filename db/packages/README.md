# Packages Schema

Business interpretation tables — contextual projections over the canonical ledger.

## Rules for Coding Agents

1. **Schema Definition**: All tables MUST use `pgSchema('packages')`.
2. **Tenant Context**: Every table includes a `tenantId` column (`uuid`) with a foreign key to `platform.tenants(id)`.
3. **No Data Duplication**: Never copy communication or identity data from the ledger. Reference it via foreign keys or derive it at query time.
4. **Projections Only**: Tables here represent business context (Sales, HR, Legal, etc.), not reality. Reality lives in `db/ledger/`.
5. **Relations**: Define in `db/packages/relations.ts`.
6. **Types**: Add Select/Insert types in `db/packages/types.ts`.
7. **Migrations**: Run `npm run db:generate` after schema changes.
