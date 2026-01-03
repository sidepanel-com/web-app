import { items } from "./schema";

export type ProductItem = typeof items.$inferSelect;
export type NewProductItem = typeof items.$inferInsert;

