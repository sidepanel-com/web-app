import { relations } from 'drizzle-orm';
import { items } from './schema';
import { tenants } from '../platform/schema';

export const itemsRelations = relations(items, ({ one }) => ({
    tenant: one(tenants, {
        fields: [items.tenantId],
        references: [tenants.id],
    }),
}));

