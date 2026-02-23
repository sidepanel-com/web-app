import { relations } from "drizzle-orm";
import { memberProfiles, orgUnits } from "../permissions/schema";
import { tenants } from "../platform/schema";
import { workspaceThreadAssignments, workspaceThreads } from "./schema";

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
