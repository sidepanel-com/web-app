import { relations } from "drizzle-orm";
import { connections, syncState, rawRecords, listeners } from "./schema";

export const connectionsRelations = relations(connections, ({ one, many }) => ({
  listeners: many(listeners),
  syncStates: many(syncState),
  rawRecords: many(rawRecords),
}));

export const listenersRelations = relations(listeners, ({ one, many }) => ({
  connection: one(connections, {
    fields: [listeners.connectionId],
    references: [connections.id],
  }),
  rawRecords: many(rawRecords),
}));

export const rawRecordsRelations = relations(rawRecords, ({ one }) => ({
  connection: one(connections, {
    fields: [rawRecords.connectionId],
    references: [connections.id],
  }),
  listener: one(listeners, {
    fields: [rawRecords.listenerId],
    references: [listeners.id],
  }),
}));

export const syncStateRelations = relations(syncState, ({ one }) => ({
  connection: one(connections, {
    fields: [syncState.connectionId],
    references: [connections.id],
  }),
}));
