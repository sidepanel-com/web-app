// db/types.ts

/**
 * Generic helpers for deriving types from Drizzle tables.
 * These are the ONLY types helpers that should be used.
 */

export type SelectModel<T extends { $inferSelect: unknown }> =
  T["$inferSelect"];

export type InsertModel<T extends { $inferInsert: unknown }> =
  T["$inferInsert"];

/**
 * Convenience helpers (optional, but nice)
 */
export type UpdateModel<T extends { $inferInsert: unknown }> =
  Partial<T["$inferInsert"]>;