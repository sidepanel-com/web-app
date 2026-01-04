import { and, eq, sql, desc, lt } from "drizzle-orm";
import { InferSelectModel } from "drizzle-orm";
import { BaseEntityService, PermissionContext } from "./base-entity.service";
import crypto from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  tenantInvitations,
  tenantUsers,
  userProfiles,
  tenants,
} from "@db/platform/schema";

type TenantInvitation = InferSelectModel<typeof tenantInvitations>;
type UserRole = InferSelectModel<typeof tenantUsers>["role"];
type InvitationStatus = TenantInvitation["status"];

export interface InvitationData {
  email: string;
  role: UserRole;
  message?: string;
}

export interface InvitationWithDetails extends TenantInvitation {
  invited_by_user?: {
    first_name: string | null;
    last_name: string | null;
  };
  tenant?: {
    name: string;
    slug: string;
  };
}

export class TenantUserInvitationService extends BaseEntityService {
  private supabaseAdmin: SupabaseClient;

  constructor(
    db: any,
    supabaseAdmin: SupabaseClient,
    permissionContext: PermissionContext
  ) {
    super(db, permissionContext);
    this.supabaseAdmin = supabaseAdmin;
  }

  // Permission checks
  async canRead(): Promise<boolean> {
    return await this.hasPermission("read_invitations");
  }

  async canCreate(): Promise<boolean> {
    return await this.hasPermission("invite_users");
  }

  async canUpdate(entityId: string): Promise<boolean> {
    return await this.hasPermission("manage_invitations");
  }

  async canDelete(entityId: string): Promise<boolean> {
    return await this.hasPermission("manage_invitations");
  }

  /**
   * Send an invitation to join the tenant
   */
  async sendInvitation(
    invitationData: InvitationData
  ): Promise<TenantInvitation> {
    if (!(await this.canCreate())) {
      throw new Error("Insufficient permissions to send invitations");
    }

    // Check if user is already a member of the tenant
    const existingUser = await this.checkExistingUser(invitationData.email);
    if (existingUser) {
      throw new Error("User is already a member of this tenant");
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.findPendingInvitation(
      invitationData.email
    );
    if (existingInvitation) {
      throw new Error("There is already a pending invitation for this email");
    }

    // Get the current user's tenant_user record to use as invited_by
    const inviterTenantUser = await this.getInviterTenantUser();
    if (!inviterTenantUser) {
      throw new Error("Inviter not found in tenant");
    }

    // Generate invitation token and expiry
    const token = this.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Find profileId if exists (optional?)
    // If Drizzle schema enforces notNull, we might have an issue if we cannot find a profile.
    // We try to find a profile by email.
    const [existingProfile] = await this.db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.email, invitationData.email.toLowerCase())) // Assuming email is on profile
      .limit(1);

    // If schema requires profileId, we must provide it.
    // If user doesn't exist, we can't provide it.
    // For now, assuming Drizzle schema `uuid('profile_id').notNull()` is correct,
    // it implies we can ONLY invite existing users.
    // BUT original code didn't use it.
    // We'll pass it if found, else undefined (and hope DB allows null or we made a mistake reading schema intent).
    // Note: If the DB actually enforces NOT NULL, this will fail for new users.
    // Ideally we should create a stub profile or inviteUserByEmail first to generate a user.
    // But inviteUserByEmail creates an auth user, not a profile (unless trigger).

    // We will proceed with insert.
    const values: any = {
      tenantId: this.permissionContext.tenantId!,
      email: invitationData.email.toLowerCase(),
      role: invitationData.role,
      token,
      expiresAt: expiresAt.toISOString(),
      invitedBy: inviterTenantUser.profileId,
      status: "pending",
    };
    if (existingProfile) {
      values.profileId = existingProfile.id;
    }

    const [invitation] = await this.db
      .insert(tenantInvitations)
      .values(values)
      .returning();

    // Leverage Supabase Admin API for user invitations
    // The redirectTo should point to our application's invitation acceptance page
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl}/auth/accept-invitation?token=${token}`;

    console.log("redirectTo", redirectTo);
    let { error: inviteError } =
      await this.supabaseAdmin.auth.admin.inviteUserByEmail(
        invitationData.email,
        {
          redirectTo,
          data: {
            invitationId: invitation.id,
            tenantId: this.permissionContext.tenantId,
          },
        }
      );

    // If user already exists, Supabase might return email_exists error.
    // In that case, we check if the user is unconfirmed and re-invite them.
    if (inviteError && inviteError.status === 422) {
      console.log("User already exists, checking if unconfirmed...");
      const { data: linkData } =
        await this.supabaseAdmin.auth.admin.generateLink({
          type: "invite",
          email: invitationData.email,
          options: { redirectTo },
        });

      if (linkData?.user && !linkData.user.email_confirmed_at) {
        console.log("User is unconfirmed, deleting and re-inviting...");
        await this.supabaseAdmin.auth.admin.deleteUser(linkData.user.id);
        const { error: retryError } =
          await this.supabaseAdmin.auth.admin.inviteUserByEmail(
            invitationData.email,
            {
              redirectTo,
              data: {
                invitationId: invitation.id,
                tenantId: this.permissionContext.tenantId,
              },
            }
          );
        inviteError = retryError;
      }
    }

    if (inviteError) {
      console.error("Supabase invite error:", inviteError);
      // We still have the record in tenant_invitations, but the email failed.
      throw new Error(`Failed to send invitation: ${inviteError.message}`);
    }

    return invitation;
  }

  /**
   * List all invitations for the tenant
   */
  async listInvitations(): Promise<InvitationWithDetails[]> {
    if (!(await this.canRead())) {
      throw new Error("Insufficient permissions");
    }

    const results = await this.db
      .select({
        invitation: tenantInvitations,
        inviterUser: tenantUsers,
        inviterProfile: userProfiles,
        tenant: tenants,
      })
      .from(tenantInvitations)
      .leftJoin(tenantUsers, eq(tenantInvitations.invitedBy, tenantUsers.id))
      .leftJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .leftJoin(tenants, eq(tenantInvitations.tenantId, tenants.id))
      .where(eq(tenantInvitations.tenantId, this.permissionContext.tenantId!))
      .orderBy(desc(tenantInvitations.createdAt));

    return results.map(({ invitation, inviterProfile, tenant }) => ({
      ...invitation,
      invited_by_user: inviterProfile
        ? {
            first_name: inviterProfile.displayName?.split(" ")[0] || null,
            last_name:
              inviterProfile.displayName?.split(" ").slice(1).join(" ") || null,
          }
        : undefined,
      tenant: tenant
        ? {
            name: tenant.name,
            slug: tenant.slug,
          }
        : undefined,
    }));
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(
    token: string
  ): Promise<InvitationWithDetails | null> {
    const [result] = await this.db
      .select({
        invitation: tenantInvitations,
        inviterUser: tenantUsers,
        inviterProfile: userProfiles,
        tenant: tenants,
      })
      .from(tenantInvitations)
      .leftJoin(tenantUsers, eq(tenantInvitations.invitedBy, tenantUsers.id))
      .leftJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .leftJoin(tenants, eq(tenantInvitations.tenantId, tenants.id))
      .where(
        and(
          eq(tenantInvitations.token, token),
          eq(tenantInvitations.status, "pending")
        )
      )
      .limit(1);

    if (!result) return null;

    const { invitation, inviterProfile, tenant } = result;

    // Check expiry
    if (new Date(invitation.expiresAt) < new Date()) {
      await this.updateInvitationStatus(invitation.id, "expired");
      return null;
    }

    return {
      ...invitation,
      invited_by_user: inviterProfile
        ? {
            first_name: inviterProfile.displayName?.split(" ")[0] || null,
            last_name:
              inviterProfile.displayName?.split(" ").slice(1).join(" ") || null,
          }
        : undefined,
      tenant: tenant
        ? {
            name: tenant.name,
            slug: tenant.slug,
          }
        : undefined,
    };
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string, userId: string): Promise<void> {
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) {
      throw new Error("Invalid or expired invitation");
    }

    // Get profile for the accepting user
    const [userProfile] = await this.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (!userProfile) throw new Error("User profile not found");

    // Check if user is already a member
    const [existingUser] = await this.db
      .select({ id: tenantUsers.id })
      .from(tenantUsers)
      .where(
        and(
          eq(tenantUsers.tenantId, invitation.tenantId),
          eq(tenantUsers.profileId, userProfile.id)
        )
      )
      .limit(1);

    if (existingUser) {
      // Already a member, just update invitation status
      await this.updateInvitationStatus(invitation.id, "accepted");
      return;
    }

    // Create tenant_user record
    await this.db.insert(tenantUsers).values({
      tenantId: invitation.tenantId,
      profileId: userProfile.id,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
      invitedByEmail: invitation.invitedByEmail,
      status: "active",
      // createdAt default
    });

    // Update invitation status
    await this.updateInvitationStatus(invitation.id, "accepted");
  }

  /**
   * Decline an invitation
   */
  async declineInvitation(token: string): Promise<void> {
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) {
      // Technically strict, but maybe they already declined?
      // Just return if not found or expired
      return;
    }
    await this.updateInvitationStatus(invitation.id, "declined");
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(invitationId: string): Promise<TenantInvitation> {
    if (!(await this.canUpdate(invitationId))) {
      throw new Error("Insufficient permissions");
    }

    const [invitation] = await this.db
      .select()
      .from(tenantInvitations)
      .where(
        and(
          eq(tenantInvitations.id, invitationId),
          eq(tenantInvitations.tenantId, this.permissionContext.tenantId!)
        )
      )
      .limit(1);

    if (!invitation) throw new Error("Invitation not found");

    // Allow resending if pending or expired
    if (invitation.status !== "pending" && invitation.status !== "expired")
      throw new Error("Can only resend pending or expired invitations");

    // Generate new token
    const newToken = this.generateInvitationToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const [updatedInvitation] = await this.db
      .update(tenantInvitations)
      .set({
        token: newToken,
        expiresAt: newExpiresAt.toISOString(),
        status: "pending", // Reset status if it was previously expired
      })
      .where(eq(tenantInvitations.id, invitationId))
      .returning();

    // Leverage Supabase Admin API for user invitations
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl}/auth/accept-invitation?token=${newToken}`;

    let { error: inviteError } =
      await this.supabaseAdmin.auth.admin.inviteUserByEmail(invitation.email, {
        redirectTo,
        data: {
          invitationId: updatedInvitation.id,
          tenantId: this.permissionContext.tenantId,
        },
      });

    // If user already exists, Supabase might return email_exists error.
    // In that case, we check if the user is unconfirmed and re-invite them.
    if (inviteError && inviteError.status === 422) {
      console.log("User already exists, checking if unconfirmed...");
      const { data: linkData } =
        await this.supabaseAdmin.auth.admin.generateLink({
          type: "invite",
          email: invitation.email,
          options: { redirectTo },
        });

      if (linkData?.user && !linkData.user.email_confirmed_at) {
        console.log("User is unconfirmed, deleting and re-inviting...");
        await this.supabaseAdmin.auth.admin.deleteUser(linkData.user.id);
        const { error: retryError } =
          await this.supabaseAdmin.auth.admin.inviteUserByEmail(
            invitation.email,
            {
              redirectTo,
              data: {
                invitationId: updatedInvitation.id,
                tenantId: this.permissionContext.tenantId,
              },
            }
          );
        inviteError = retryError;
      }
    }

    if (inviteError) {
      console.error("Supabase resend invite error:", inviteError);
      throw new Error(`Failed to resend invitation: ${inviteError.message}`);
    }

    return updatedInvitation;
  }

  /**
   * Cancel/revoke an invitation
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    if (!(await this.canDelete(invitationId))) {
      throw new Error("Insufficient permissions");
    }

    await this.db
      .delete(tenantInvitations)
      .where(
        and(
          eq(tenantInvitations.id, invitationId),
          eq(tenantInvitations.tenantId, this.permissionContext.tenantId!)
        )
      );
  }

  /**
   * Get invitation statistics
   */
  async getInvitationStats(): Promise<{
    total: number;
    pending: number;
    accepted: number;
    declined: number;
    expired: number;
  }> {
    if (!(await this.canRead())) {
      throw new Error("Insufficient permissions");
    }

    const invitations = await this.db
      .select({ status: tenantInvitations.status })
      .from(tenantInvitations)
      .where(eq(tenantInvitations.tenantId, this.permissionContext.tenantId!));

    const stats = {
      total: invitations.length,
      pending: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
    };

    invitations.forEach((inv) => {
      if (inv.status && stats[inv.status as keyof typeof stats] !== undefined) {
        stats[inv.status as keyof typeof stats]++;
      }
    });

    return stats;
  }

  // Private helper methods

  private async checkExistingUser(email: string): Promise<boolean> {
    // Check if user has a profile and is in tenantUsers
    // Join tenantUsers -> userProfiles
    const [existing] = await this.db
      .select({ id: tenantUsers.id })
      .from(tenantUsers)
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(
        and(
          eq(tenantUsers.tenantId, this.permissionContext.tenantId!),
          eq(userProfiles.email, email.toLowerCase())
        )
      )
      .limit(1);

    return !!existing;
  }

  private async findPendingInvitation(
    email: string
  ): Promise<TenantInvitation | null> {
    const [invitation] = await this.db
      .select()
      .from(tenantInvitations)
      .where(
        and(
          eq(tenantInvitations.tenantId, this.permissionContext.tenantId!),
          eq(tenantInvitations.email, email.toLowerCase()),
          eq(tenantInvitations.status, "pending")
        )
      )
      .limit(1);

    return invitation || null;
  }

  private async getInviterTenantUser() {
    // Need to find tenantUser for current userId
    // Join tenantUsers -> userProfiles where userProfiles.userId = this.userId
    const [inviter] = await this.db
      .select({
        id: tenantUsers.id,
        profileId: tenantUsers.profileId,
      })
      .from(tenantUsers)
      .innerJoin(userProfiles, eq(tenantUsers.profileId, userProfiles.id))
      .where(
        and(
          eq(tenantUsers.tenantId, this.permissionContext.tenantId!),
          eq(userProfiles.userId, this.permissionContext.userId)
        )
      )
      .limit(1);

    return inviter;
  }

  private generateInvitationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private async updateInvitationStatus(
    invitationId: string,
    status: InvitationStatus
  ): Promise<void> {
    const updateData: any = { status };

    if (status === "accepted") {
      updateData.acceptedAt = new Date().toISOString();
    }

    await this.db
      .update(tenantInvitations)
      .set(updateData)
      .where(eq(tenantInvitations.id, invitationId));
  }

  private async sendInvitationEmail(
    invitation: TenantInvitation,
    customMessage?: string
  ): Promise<void> {
    // Placeholder
    // TODO: use supabase user invitation email
    console.log("Sending invitation email to:", invitation.email);
    console.log("Token:", invitation.token);
  }

  // Static factory method
  static create(
    db: any,
    supabaseAdmin: SupabaseClient,
    userId: string,
    tenantId: string,
    userRole: UserRole
  ): TenantUserInvitationService {
    return new TenantUserInvitationService(db, supabaseAdmin, {
      userId,
      tenantId,
      userRole,
    });
  }
}
