import type { SelectModel, InsertModel } from "@/db/types";
import { tenants } from "./schema";

export type Tenant = SelectModel<typeof tenants>;
export type NewTenant = InsertModel<typeof tenants>;