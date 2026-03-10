import { eq, and, sql } from "drizzle-orm";
import type { DrizzleClient } from "./db";
import { userProfiles, tenants, tenantUsers, tenantPackages } from "@db/platform/schema";
import { memberProfiles, memberProfileOrgUnits, orgUnits } from "@db/permissions/schema";

export interface RequestContext {
  profileId: string;
  userId: string;
  email: string;
  displayName: string | null;
  tenantId: string;
  tenantSlug: string;
  userRole: "owner" | "admin" | "member" | "viewer" | null;
  memberProfileId: string | null;
  orgUnitIds: string[];
  orgUnitPaths: string[];
  packageEnabled: boolean;
}

/**
 * Resolves all auth/tenant/permission/package context in a single query
 * for session-authenticated users, plus one follow-up for org units.
 * Replaces 7 sequential queries from the old middleware flow.
 */
export async function resolveSessionContext(
  db: DrizzleClient,
  supabaseUserId: string,
  tenantSlug: string,
  packageId: string | undefined,
): Promise<RequestContext | null> {
  const baseQuery = db
    .select({
      profileId: userProfiles.id,
      userId: userProfiles.userId,
      email: userProfiles.email,
      displayName: userProfiles.displayName,
      tenantId: tenants.id,
      tenantSlug: tenants.slug,
      userRole: tenantUsers.role,
      memberProfileId: memberProfiles.id,
      packageEnabled: packageId
        ? sql<boolean>`coalesce(${tenantPackages.enabled}, true)`
        : sql<boolean>`true`,
    })
    .from(userProfiles)
    .innerJoin(
      tenantUsers,
      and(
        eq(tenantUsers.profileId, userProfiles.id),
        eq(tenantUsers.status, "active"),
      ),
    )
    .innerJoin(
      tenants,
      and(eq(tenants.id, tenantUsers.tenantId), eq(tenants.slug, tenantSlug)),
    )
    .leftJoin(
      memberProfiles,
      and(
        eq(memberProfiles.tenantUserId, tenantUsers.id),
        eq(memberProfiles.tenantId, tenants.id),
      ),
    );

  const query = packageId
    ? baseQuery.leftJoin(
        tenantPackages,
        and(
          eq(tenantPackages.tenantId, tenants.id),
          eq(tenantPackages.packageId, packageId),
        ),
      )
    : baseQuery;

  const rows = await query.where(eq(userProfiles.userId, supabaseUserId)).limit(1);
  const row = rows[0];
  if (!row) return null;

  const { orgUnitIds, orgUnitPaths } = row.memberProfileId
    ? await resolveOrgUnits(db, row.memberProfileId)
    : { orgUnitIds: [] as string[], orgUnitPaths: [] as string[] };

  return {
    profileId: row.profileId,
    userId: row.userId,
    email: row.email,
    displayName: row.displayName,
    tenantId: row.tenantId,
    tenantSlug: row.tenantSlug,
    userRole: row.userRole as RequestContext["userRole"],
    memberProfileId: row.memberProfileId,
    orgUnitIds,
    orgUnitPaths,
    packageEnabled: row.packageEnabled,
  };
}

/**
 * Resolves context for API key auth. The API key lookup is inherently
 * separate (hash comparison), so this consolidates the remaining
 * profile + tenant + member + package queries into one.
 */
export async function resolveApiKeyContext(
  db: DrizzleClient,
  profileId: string,
  tenantId: string,
  tenantSlug: string,
  packageId: string | undefined,
): Promise<RequestContext | null> {
  const baseQuery = db
    .select({
      profileId: userProfiles.id,
      userId: userProfiles.userId,
      email: userProfiles.email,
      displayName: userProfiles.displayName,
      tenantUserId: tenantUsers.id,
      memberProfileId: memberProfiles.id,
      packageEnabled: packageId
        ? sql<boolean>`coalesce(${tenantPackages.enabled}, true)`
        : sql<boolean>`true`,
    })
    .from(userProfiles)
    .innerJoin(
      tenantUsers,
      and(
        eq(tenantUsers.profileId, userProfiles.id),
        eq(tenantUsers.tenantId, tenantId),
        eq(tenantUsers.status, "active"),
      ),
    )
    .leftJoin(
      memberProfiles,
      and(
        eq(memberProfiles.tenantUserId, tenantUsers.id),
        eq(memberProfiles.tenantId, tenantId),
      ),
    );

  const query = packageId
    ? baseQuery.leftJoin(
        tenantPackages,
        and(
          eq(tenantPackages.tenantId, tenantId),
          eq(tenantPackages.packageId, packageId),
        ),
      )
    : baseQuery;

  const rows = await query.where(eq(userProfiles.id, profileId)).limit(1);
  const row = rows[0];
  if (!row) return null;

  const { orgUnitIds, orgUnitPaths } = row.memberProfileId
    ? await resolveOrgUnits(db, row.memberProfileId)
    : { orgUnitIds: [] as string[], orgUnitPaths: [] as string[] };

  return {
    profileId: row.profileId,
    userId: row.userId,
    email: row.email,
    displayName: row.displayName,
    tenantId,
    tenantSlug,
    userRole: null,
    memberProfileId: row.memberProfileId,
    orgUnitIds,
    orgUnitPaths,
    packageEnabled: row.packageEnabled,
  };
}

async function resolveOrgUnits(
  db: DrizzleClient,
  memberProfileId: string,
): Promise<{ orgUnitIds: string[]; orgUnitPaths: string[] }> {
  const orgRows = await db
    .select({
      orgUnitId: memberProfileOrgUnits.orgUnitId,
      path: orgUnits.path,
    })
    .from(memberProfileOrgUnits)
    .innerJoin(orgUnits, eq(orgUnits.id, memberProfileOrgUnits.orgUnitId))
    .where(eq(memberProfileOrgUnits.memberProfileId, memberProfileId));

  return {
    orgUnitIds: orgRows.map((r) => r.orgUnitId),
    orgUnitPaths: orgRows
      .map((r) => r.path)
      .filter((p): p is string => p != null),
  };
}
