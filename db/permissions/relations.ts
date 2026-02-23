import { relations } from "drizzle-orm";
import { tenants, tenantUsers } from "../platform/schema";
import { memberProfileOrgUnits, memberProfiles, orgUnits } from "./schema";

export const memberProfilesRelations = relations(
  memberProfiles,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [memberProfiles.tenantId],
      references: [tenants.id],
    }),
    tenantUser: one(tenantUsers, {
      fields: [memberProfiles.tenantUserId],
      references: [tenantUsers.id],
    }),
    orgUnits: many(memberProfileOrgUnits),
  }),
);

export const orgUnitsRelations = relations(orgUnits, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orgUnits.tenantId],
    references: [tenants.id],
  }),
  parent: one(orgUnits, {
    fields: [orgUnits.parentOrgUnitId],
    references: [orgUnits.id],
    relationName: "orgUnitHierarchy",
  }),
  children: many(orgUnits, { relationName: "orgUnitHierarchy" }),
  members: many(memberProfileOrgUnits),
}));

export const memberProfileOrgUnitsRelations = relations(
  memberProfileOrgUnits,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [memberProfileOrgUnits.tenantId],
      references: [tenants.id],
    }),
    memberProfile: one(memberProfiles, {
      fields: [memberProfileOrgUnits.memberProfileId],
      references: [memberProfiles.id],
    }),
    orgUnit: one(orgUnits, {
      fields: [memberProfileOrgUnits.orgUnitId],
      references: [orgUnits.id],
    }),
  }),
);
