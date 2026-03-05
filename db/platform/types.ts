import type { SelectModel, InsertModel } from "../types";
import { tenants, tenantPackages } from "./schema";

export type Tenant = SelectModel<typeof tenants>;
export type NewTenant = InsertModel<typeof tenants>;

export type TenantPackage = SelectModel<typeof tenantPackages>;
export type NewTenantPackage = InsertModel<typeof tenantPackages>;