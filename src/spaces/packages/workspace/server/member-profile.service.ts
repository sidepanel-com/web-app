import { eq, and } from "drizzle-orm";
import type { DrizzleClient } from "@/spaces/platform/server/db";
import { tenantUsers, userProfiles } from "@db/platform/schema";
import { memberProfiles } from "@db/permissions/schema";

export interface MemberWithStatus {
  tenantUserId: string;
  email: string;
  displayName: string | null;
  role: string;
  hasMemberProfile: boolean;
  memberProfileId: string | null;
  memberProfileCreatedAt: string | null;
}

export class MemberProfileService {
  constructor(
    private db: DrizzleClient,
    private tenantId: string,
  ) {}

  async getMembersWithStatus(): Promise<MemberWithStatus[]> {
    const rows = await this.db
      .select({
        tenantUserId: tenantUsers.id,
        email: userProfiles.email,
        displayName: userProfiles.displayName,
        role: tenantUsers.role,
        memberProfileId: memberProfiles.id,
        memberProfileCreatedAt: memberProfiles.createdAt,
      })
      .from(tenantUsers)
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .leftJoin(
        memberProfiles,
        and(
          eq(memberProfiles.tenantUserId, tenantUsers.id),
          eq(memberProfiles.tenantId, tenantUsers.tenantId),
        ),
      )
      .where(eq(tenantUsers.tenantId, this.tenantId));

    return rows.map((row) => ({
      tenantUserId: row.tenantUserId,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
      hasMemberProfile: row.memberProfileId !== null,
      memberProfileId: row.memberProfileId,
      memberProfileCreatedAt: row.memberProfileCreatedAt,
    }));
  }

  async createMemberProfile(tenantUserId: string) {
    const [tenantUser] = await this.db
      .select({ id: tenantUsers.id })
      .from(tenantUsers)
      .where(
        and(
          eq(tenantUsers.id, tenantUserId),
          eq(tenantUsers.tenantId, this.tenantId),
        ),
      )
      .limit(1);

    if (!tenantUser) {
      throw new Error("Tenant user not found");
    }

    const [existing] = await this.db
      .select({ id: memberProfiles.id })
      .from(memberProfiles)
      .where(eq(memberProfiles.tenantUserId, tenantUserId))
      .limit(1);

    if (existing) {
      throw new Error("Member profile already exists for this user");
    }

    const [profile] = await this.db
      .insert(memberProfiles)
      .values({
        tenantId: this.tenantId,
        tenantUserId,
      })
      .returning();

    return profile;
  }

  async deleteMemberProfile(memberProfileId: string) {
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

    await this.db
      .delete(memberProfiles)
      .where(
        and(
          eq(memberProfiles.id, memberProfileId),
          eq(memberProfiles.tenantId, this.tenantId),
        ),
      );
  }

  static create(db: DrizzleClient, tenantId: string) {
    return new MemberProfileService(db, tenantId);
  }
}
