import { eq, and } from "drizzle-orm";
import type { DrizzleClient } from "@/spaces/platform/server/db";
import { tenantUsers } from "@db/platform/schema";
import {
  memberProfiles,
  memberProfileOrgUnits,
  orgUnits,
} from "@db/permissions/schema";

export interface MemberContext {
  memberProfileId: string | null;
  orgUnitIds: string[];
  orgUnitPaths: string[];
}

/**
 * Resolve permission-layer identity for a user within a tenant.
 *
 * Looks up the member profile (1:1 with tenant_users) and its
 * org unit memberships. Returns null fields gracefully when the
 * member profile does not yet exist (e.g. newly invited user).
 */
export async function resolveMemberContext(
  db: DrizzleClient,
  tenantId: string,
  userProfileId: string,
): Promise<MemberContext> {
  const [tenantUser] = await db
    .select({ id: tenantUsers.id })
    .from(tenantUsers)
    .where(
      and(
        eq(tenantUsers.tenantId, tenantId),
        eq(tenantUsers.profileId, userProfileId),
      ),
    )
    .limit(1);

  if (!tenantUser) {
    return { memberProfileId: null, orgUnitIds: [], orgUnitPaths: [] };
  }

  const [profile] = await db
    .select({ id: memberProfiles.id })
    .from(memberProfiles)
    .where(
      and(
        eq(memberProfiles.tenantUserId, tenantUser.id),
        eq(memberProfiles.tenantId, tenantId),
      ),
    )
    .limit(1);

  if (!profile) {
    return { memberProfileId: null, orgUnitIds: [], orgUnitPaths: [] };
  }

  const orgRows = await db
    .select({
      orgUnitId: memberProfileOrgUnits.orgUnitId,
      path: orgUnits.path,
    })
    .from(memberProfileOrgUnits)
    .innerJoin(orgUnits, eq(orgUnits.id, memberProfileOrgUnits.orgUnitId))
    .where(eq(memberProfileOrgUnits.memberProfileId, profile.id));

  return {
    memberProfileId: profile.id,
    orgUnitIds: orgRows.map((r) => r.orgUnitId),
    orgUnitPaths: orgRows.map((r) => r.path).filter((p): p is string => p != null),
  };
}
