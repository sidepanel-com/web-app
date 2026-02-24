import {
  memberProfileOrgUnits,
  memberProfiles,
  orgUnits,
} from "@db/permissions/schema";
import { tenantUsers, userProfiles } from "@db/platform/schema";
import { and, count, eq, like, sql } from "drizzle-orm";
import type { DrizzleClient } from "@/spaces/platform/server/db";

export interface OrgUnitMember {
  memberProfileId: string;
  tenantUserId: string;
  email: string;
  displayName: string | null;
  assignedAt: string;
}

export interface OrgUnitWithMemberCount {
  id: string;
  tenantId: string;
  name: string;
  parentOrgUnitId: string | null;
  path: string | null;
  createdAt: string;
  memberCount: number;
}

export class OrgUnitService {
  constructor(
    private db: DrizzleClient,
    private tenantId: string,
  ) {}

  async list(): Promise<OrgUnitWithMemberCount[]> {
    const rows = await this.db
      .select({
        id: orgUnits.id,
        tenantId: orgUnits.tenantId,
        name: orgUnits.name,
        parentOrgUnitId: orgUnits.parentOrgUnitId,
        path: orgUnits.path,
        createdAt: orgUnits.createdAt,
        memberCount: count(memberProfileOrgUnits.id),
      })
      .from(orgUnits)
      .leftJoin(
        memberProfileOrgUnits,
        eq(memberProfileOrgUnits.orgUnitId, orgUnits.id),
      )
      .where(eq(orgUnits.tenantId, this.tenantId))
      .groupBy(orgUnits.id)
      .orderBy(orgUnits.name);

    return rows.map((row) => ({
      ...row,
      memberCount: Number(row.memberCount),
    }));
  }

  async getById(id: string) {
    const [unit] = await this.db
      .select()
      .from(orgUnits)
      .where(and(eq(orgUnits.id, id), eq(orgUnits.tenantId, this.tenantId)))
      .limit(1);

    if (!unit) {
      throw new Error("Org unit not found");
    }
    return unit;
  }

  async createOrgUnit(name: string, parentOrgUnitId?: string | null) {
    let parentPath: string | null = null;

    if (parentOrgUnitId) {
      const parent = await this.getById(parentOrgUnitId);
      parentPath = parent.path;
    }

    const [unit] = await this.db
      .insert(orgUnits)
      .values({
        tenantId: this.tenantId,
        name,
        parentOrgUnitId: parentOrgUnitId ?? null,
        path: "placeholder",
      })
      .returning();

    const computedPath = parentPath
      ? `${parentPath}/${unit.id}`
      : `/${unit.id}`;

    const [updated] = await this.db
      .update(orgUnits)
      .set({ path: computedPath })
      .where(eq(orgUnits.id, unit.id))
      .returning();

    return updated;
  }

  async update(
    id: string,
    data: { name?: string; parentOrgUnitId?: string | null },
  ) {
    const existing = await this.getById(id);
    const updates: Partial<{
      name: string;
      parentOrgUnitId: string | null;
      path: string;
    }> = {};

    if (data.name !== undefined) {
      updates.name = data.name;
    }

    const isReparenting =
      data.parentOrgUnitId !== undefined &&
      data.parentOrgUnitId !== existing.parentOrgUnitId;

    if (isReparenting) {
      if (data.parentOrgUnitId === id) {
        throw new Error("Cannot set an org unit as its own parent");
      }

      if (data.parentOrgUnitId) {
        const newParent = await this.getById(data.parentOrgUnitId);
        if (newParent.path?.startsWith(existing.path ?? "")) {
          throw new Error(
            "Cannot move an org unit under one of its descendants",
          );
        }
      }

      updates.parentOrgUnitId = data.parentOrgUnitId ?? null;

      let newParentPath: string | null = null;
      if (data.parentOrgUnitId) {
        const parent = await this.getById(data.parentOrgUnitId);
        newParentPath = parent.path;
      }

      const newPath = newParentPath ? `${newParentPath}/${id}` : `/${id}`;
      updates.path = newPath;

      const oldPath = existing.path ?? "";
      if (oldPath) {
        await this.db
          .update(orgUnits)
          .set({
            path: sql`${newPath} || substring(${orgUnits.path} from ${oldPath.length + 1})`,
          })
          .where(
            and(
              eq(orgUnits.tenantId, this.tenantId),
              like(orgUnits.path, `${oldPath}/%`),
            ),
          );
      }
    }

    if (Object.keys(updates).length === 0) {
      return existing;
    }

    const [updated] = await this.db
      .update(orgUnits)
      .set(updates)
      .where(and(eq(orgUnits.id, id), eq(orgUnits.tenantId, this.tenantId)))
      .returning();

    return updated;
  }

  async delete(id: string) {
    await this.getById(id);

    const [child] = await this.db
      .select({ id: orgUnits.id })
      .from(orgUnits)
      .where(
        and(
          eq(orgUnits.parentOrgUnitId, id),
          eq(orgUnits.tenantId, this.tenantId),
        ),
      )
      .limit(1);

    if (child) {
      throw new Error(
        "Cannot delete org unit with children. Remove or move children first.",
      );
    }

    await this.db
      .delete(orgUnits)
      .where(and(eq(orgUnits.id, id), eq(orgUnits.tenantId, this.tenantId)));
  }

  async getMembers(orgUnitId: string): Promise<OrgUnitMember[]> {
    await this.getById(orgUnitId);

    const rows = await this.db
      .select({
        memberProfileId: memberProfiles.id,
        tenantUserId: memberProfiles.tenantUserId,
        email: userProfiles.email,
        displayName: userProfiles.displayName,
        assignedAt: memberProfileOrgUnits.createdAt,
      })
      .from(memberProfileOrgUnits)
      .innerJoin(
        memberProfiles,
        eq(memberProfileOrgUnits.memberProfileId, memberProfiles.id),
      )
      .innerJoin(tenantUsers, eq(memberProfiles.tenantUserId, tenantUsers.id))
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(
        and(
          eq(memberProfileOrgUnits.orgUnitId, orgUnitId),
          eq(memberProfileOrgUnits.tenantId, this.tenantId),
        ),
      )
      .orderBy(userProfiles.email);

    return rows;
  }

  async assignMember(orgUnitId: string, memberProfileId: string) {
    await this.getById(orgUnitId);

    const [profile] = await this.db
      .select({ id: memberProfiles.id })
      .from(memberProfiles)
      .where(
        and(
          eq(memberProfiles.id, memberProfileId),
          eq(memberProfiles.tenantId, this.tenantId),
        ),
      )
      .limit(1);

    if (!profile) {
      throw new Error("Member profile not found");
    }

    const [existing] = await this.db
      .select({ id: memberProfileOrgUnits.id })
      .from(memberProfileOrgUnits)
      .where(
        and(
          eq(memberProfileOrgUnits.orgUnitId, orgUnitId),
          eq(memberProfileOrgUnits.memberProfileId, memberProfileId),
        ),
      )
      .limit(1);

    if (existing) {
      throw new Error("Member is already assigned to this org unit");
    }

    const [assignment] = await this.db
      .insert(memberProfileOrgUnits)
      .values({
        tenantId: this.tenantId,
        orgUnitId,
        memberProfileId,
      })
      .returning();

    return assignment;
  }

  async removeMember(orgUnitId: string, memberProfileId: string) {
    const [assignment] = await this.db
      .select({ id: memberProfileOrgUnits.id })
      .from(memberProfileOrgUnits)
      .where(
        and(
          eq(memberProfileOrgUnits.orgUnitId, orgUnitId),
          eq(memberProfileOrgUnits.memberProfileId, memberProfileId),
          eq(memberProfileOrgUnits.tenantId, this.tenantId),
        ),
      )
      .limit(1);

    if (!assignment) {
      throw new Error("Member is not assigned to this org unit");
    }

    await this.db
      .delete(memberProfileOrgUnits)
      .where(eq(memberProfileOrgUnits.id, assignment.id));
  }

  static create(db: DrizzleClient, tenantId: string) {
    return new OrgUnitService(db, tenantId);
  }
}
