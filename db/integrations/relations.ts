import { relations } from "drizzle-orm";
import { connections, syncState, rawRecords } from "./schema";

export const connectionsRelations = relations(connections, ({ one, many }) => ({
  syncStates: many(syncState),
  rawRecords: many(rawRecords),
}));

export const syncStateRelations = relations(syncState, ({ one }) => ({
  connection: one(connections, {
    fields: [syncState.connectionId],
    references: [connections.id],
  }),
}));

export const rawRecordsRelations = relations(rawRecords, ({ one }) => ({
  connection: one(connections, {
    fields: [rawRecords.connectionId],
    references: [connections.id],
  }),
}));

