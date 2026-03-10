import type {
  workspaceThreadAssignments,
  workspaceThreads,
  workspacePersonProfiles,
  workspaceCompanyProfiles,
} from "./schema";

export type WorkspaceThread = typeof workspaceThreads.$inferSelect;
export type NewWorkspaceThread = typeof workspaceThreads.$inferInsert;

export type WorkspaceThreadAssignment =
  typeof workspaceThreadAssignments.$inferSelect;
export type NewWorkspaceThreadAssignment =
  typeof workspaceThreadAssignments.$inferInsert;

export type WorkspacePersonProfile =
  typeof workspacePersonProfiles.$inferSelect;
export type NewWorkspacePersonProfile =
  typeof workspacePersonProfiles.$inferInsert;

export type WorkspaceCompanyProfile =
  typeof workspaceCompanyProfiles.$inferSelect;
export type NewWorkspaceCompanyProfile =
  typeof workspaceCompanyProfiles.$inferInsert;
