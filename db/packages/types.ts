import type { workspaceThreadAssignments, workspaceThreads } from "./schema";

export type WorkspaceThread = typeof workspaceThreads.$inferSelect;
export type NewWorkspaceThread = typeof workspaceThreads.$inferInsert;

export type WorkspaceThreadAssignment =
  typeof workspaceThreadAssignments.$inferSelect;
export type NewWorkspaceThreadAssignment =
  typeof workspaceThreadAssignments.$inferInsert;
