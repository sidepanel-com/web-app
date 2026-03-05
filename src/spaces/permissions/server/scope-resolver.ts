import type { PermissionContext } from "@/spaces/platform/server/base-entity.service";

export interface ScopeConstraints {
  /**
   * When true, query results must be filtered by org-unit membership.
   * Permissive default: false (unrestricted).
   */
  restricted: boolean;
  memberProfileId: string | undefined;
  orgUnitIds: string[];
  orgUnitPaths: string[];
  userRole: PermissionContext["userRole"];
}

/**
 * Convert permission context into scope constraints for workspace
 * projection queries.
 *
 * Ships with permissive defaults — all roles receive unrestricted access.
 * Future iterations will tighten constraints based on role and org-unit
 * membership by flipping `restricted` to true and adding filtering logic.
 */
export function resolveWorkspaceScope(
  ctx: PermissionContext,
): ScopeConstraints {
  return {
    restricted: false,
    memberProfileId: ctx.memberProfileId,
    orgUnitIds: ctx.orgUnitIds ?? [],
    orgUnitPaths: ctx.orgUnitPaths ?? [],
    userRole: ctx.userRole,
  };
}
