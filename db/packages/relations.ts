import { relations } from "drizzle-orm";
import { people, companies } from "../ledger/schema";
import { memberProfiles, orgUnits } from "../permissions/schema";
import { tenants } from "../platform/schema";
import {
  workspaceThreadAssignments,
  workspaceThreads,
  workspacePersonProfiles,
  workspaceCompanyProfiles,
} from "./schema";

export const workspaceThreadsRelations = relations(
  workspaceThreads,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [workspaceThreads.tenantId],
      references: [tenants.id],
    }),
    assignments: many(workspaceThreadAssignments),
  }),
);

export const workspaceThreadAssignmentsRelations = relations(
  workspaceThreadAssignments,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [workspaceThreadAssignments.tenantId],
      references: [tenants.id],
    }),
    thread: one(workspaceThreads, {
      fields: [workspaceThreadAssignments.threadId],
      references: [workspaceThreads.id],
    }),
    ownerMemberProfile: one(memberProfiles, {
      fields: [workspaceThreadAssignments.ownerMemberProfileId],
      references: [memberProfiles.id],
    }),
    ownerOrgUnit: one(orgUnits, {
      fields: [workspaceThreadAssignments.ownerOrgUnitId],
      references: [orgUnits.id],
    }),
  }),
);

export const workspacePersonProfilesRelations = relations(
  workspacePersonProfiles,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [workspacePersonProfiles.tenantId],
      references: [tenants.id],
    }),
    person: one(people, {
      fields: [workspacePersonProfiles.personId],
      references: [people.id],
    }),
    ownerMemberProfile: one(memberProfiles, {
      fields: [workspacePersonProfiles.ownerMemberProfileId],
      references: [memberProfiles.id],
    }),
    ownerOrgUnit: one(orgUnits, {
      fields: [workspacePersonProfiles.ownerOrgUnitId],
      references: [orgUnits.id],
    }),
  }),
);

export const workspaceCompanyProfilesRelations = relations(
  workspaceCompanyProfiles,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [workspaceCompanyProfiles.tenantId],
      references: [tenants.id],
    }),
    company: one(companies, {
      fields: [workspaceCompanyProfiles.companyId],
      references: [companies.id],
    }),
    ownerMemberProfile: one(memberProfiles, {
      fields: [workspaceCompanyProfiles.ownerMemberProfileId],
      references: [memberProfiles.id],
    }),
    ownerOrgUnit: one(orgUnits, {
      fields: [workspaceCompanyProfiles.ownerOrgUnitId],
      references: [orgUnits.id],
    }),
  }),
);
