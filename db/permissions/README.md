# Permissions Schema

Permission infrastructure — organizational structure and member identity for scope resolution.

## Rules for Coding Agents

1. **Schema Definition**: All tables MUST use `pgSchema('permissions')`.
2. **Tenant Context**: Every table includes a `tenantId` column (`uuid`) with a foreign key to `platform.tenants(id)`.
3. **No Ledger Data**: No communications, identities, or activities. Those belong in `db/ledger/`.
4. **No Business Logic**: No workflow state, CRM concepts, or package-specific data. Those belong in `db/packages/`.
5. **Member Profiles**: 1:1 with `platform.tenant_users`. All assignment and scope resolution references `memberProfiles`, not `tenantUsers` directly.
6. **Org Units**: Hierarchical grouping with materialized `path` for subtree filtering. Tenants define structure; packages define how structure affects visibility.
7. **Relations**: Define in `db/permissions/relations.ts`.
8. **Types**: Add Select/Insert types in `db/permissions/types.ts`.
9. **Migrations**: Run `npm run db:generate` after schema changes.
