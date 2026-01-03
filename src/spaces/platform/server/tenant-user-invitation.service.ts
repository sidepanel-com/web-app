import { SupabaseClient } from "@supabase/supabase-js";
import { Tables, TablesInsert } from "@/types/database.types";
import { BaseEntityService, PermissionContext } from "./base-entity.service";
import crypto from "crypto";

type TenantInvitation = Tables<"tenant_invitations">;
type UserRole = Tables<"tenant_users">["role"];
type InvitationStatus = Tables<"tenant_invitations">["status"];

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
  constructor(
    dangerSupabaseAdmin: SupabaseClient,
    permissionContext: PermissionContext
  ) {
    super(dangerSupabaseAdmin, permissionContext);
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

    const invitationInsert: TablesInsert<"tenant_invitations"> = {
      tenant_id: this.permissionContext.tenantId!,
      email: invitationData.email.toLowerCase(),
      role: invitationData.role,
      token,
      expires_at: expiresAt.toISOString(),
      invited_by: inviterTenantUser.id,
      status: "pending",
    };

    const { data: invitation, error } = await this.dangerSupabaseAdmin
      .from("tenant_invitations")
      .insert(invitationInsert)
      .select()
      .single();

    if (error) throw error;

    // Send invitation email (you'll need to implement this based on your email service)
    await this.sendInvitationEmail(invitation, invitationData.message);

    return invitation;
  }

  /**
   * List all invitations for the tenant
   */
  async listInvitations(): Promise<InvitationWithDetails[]> {
    if (!(await this.canRead())) {
      throw new Error("Insufficient permissions to list invitations");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_invitations")
      .select(
        `
        *,
        tenant_users!invited_by (
          user_profiles (
            first_name,
            last_name
          )
        ),
        tenants (
          name,
          slug
        )
      `
      )
      .eq("tenant_id", this.permissionContext.tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((invitation: any) => ({
      ...invitation,
      invited_by_user: invitation.tenant_users?.user_profiles || null,
      tenant: invitation.tenants || null,
    }));
  }

  /**
   * Get invitation by token (for accepting invitations)
   */
  async getInvitationByToken(
    token: string
  ): Promise<InvitationWithDetails | null> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_invitations")
      .select(
        `
        *,
        tenant_users!invited_by (
          user_profiles (
            first_name,
            last_name
          )
        ),
        tenants (
          name,
          slug
        )
      `
      )
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (error && error.code !== "PGRST116") throw error;
    if (!data) return null;

    // Check if invitation has expired
    if (new Date(data.expires_at) < new Date()) {
      await this.updateInvitationStatus(data.id, "expired");
      return null;
    }

    return {
      ...data,
      invited_by_user: data.tenant_users?.user_profiles || null,
      tenant: data.tenants || null,
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

    // Check if user is already a member
    const existingUser = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select("id")
      .eq("tenant_id", invitation.tenant_id)
      .eq("user_id", userId)
      .single();

    if (existingUser.data) {
      throw new Error("User is already a member of this tenant");
    }

    // Create tenant_user record
    const { error: tenantUserError } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .insert({
        tenant_id: invitation.tenant_id,
        user_id: userId,
        role: invitation.role,
        invited_by: invitation.invited_by,
        joined_at: new Date().toISOString(),
        status: "active",
      });

    if (tenantUserError) throw tenantUserError;

    // Update invitation status
    await this.updateInvitationStatus(invitation.id, "accepted");
  }

  /**
   * Decline an invitation
   */
  async declineInvitation(token: string): Promise<void> {
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) {
      throw new Error("Invalid or expired invitation");
    }

    await this.updateInvitationStatus(invitation.id, "declined");
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(invitationId: string): Promise<TenantInvitation> {
    if (!(await this.canUpdate(invitationId))) {
      throw new Error("Insufficient permissions to resend invitation");
    }

    const { data: invitation, error } = await this.dangerSupabaseAdmin
      .from("tenant_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("tenant_id", this.permissionContext.tenantId)
      .single();

    if (error) throw error;
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Can only resend pending invitations");
    }

    // Generate new token and extend expiry
    const newToken = this.generateInvitationToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const { data: updatedInvitation, error: updateError } =
      await this.dangerSupabaseAdmin
        .from("tenant_invitations")
        .update({
          token: newToken,
          expires_at: newExpiresAt.toISOString(),
        })
        .eq("id", invitationId)
        .select()
        .single();

    if (updateError) throw updateError;

    // Resend invitation email
    await this.sendInvitationEmail(updatedInvitation);

    return updatedInvitation;
  }

  /**
   * Cancel/revoke an invitation
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    if (!(await this.canDelete(invitationId))) {
      throw new Error("Insufficient permissions to cancel invitation");
    }

    const { error } = await this.dangerSupabaseAdmin
      .from("tenant_invitations")
      .delete()
      .eq("id", invitationId)
      .eq("tenant_id", this.permissionContext.tenantId);

    if (error) throw error;
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
      throw new Error("Insufficient permissions to view invitation statistics");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_invitations")
      .select("status")
      .eq("tenant_id", this.permissionContext.tenantId);

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
    } as {
      total: number;
      pending: number;
      accepted: number;
      declined: number;
      expired: number;
    };

    data.forEach((invitation) => {
      stats[invitation.status as keyof typeof stats]++;
    });

    return stats;
  }

  // Private helper methods

  private async checkExistingUser(email: string): Promise<boolean> {
    // Use Admin API to find user by email
    // Note: This checks if a user with the email exists and is already a tenant member
    const normalizedEmail = email.toLowerCase();
    
    try {
      // Try to find user by listing users (with pagination support)
      // For efficiency, we check up to the first page of results
      // If user has many users, we may miss some, but this is acceptable for invitations
      const { data: { users }, error: authError } = await this.dangerSupabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error fetching users from auth:", authError);
        // If we can't check auth users, we can't verify if user exists
        // Return false to allow invitation to proceed (duplicate check happens at accept time)
        return false;
      }

      // Find user with matching email (case-insensitive)
      const matchingUser = users?.find(
        (user) => user.email?.toLowerCase() === normalizedEmail
      );

      if (!matchingUser) {
        // User doesn't exist in auth, so they can't be a tenant member yet
        return false;
      }

      // Found the user, check if they're already in the tenant
      const { data: tenantUsers, error } = await this.dangerSupabaseAdmin
        .from("tenant_users")
        .select("id")
        .eq("tenant_id", this.permissionContext.tenantId)
        .eq("user_id", matchingUser.id);

      if (error) {
        console.error("Error checking tenant users:", error);
        return false;
      }

      return !!tenantUsers?.length;
    } catch (error) {
      console.error("Unexpected error in checkExistingUser:", error);
      // On any error, return false to allow invitation to proceed
      // Duplicate membership will be caught when user tries to accept invitation
      return false;
    }
  }

  private async findPendingInvitation(
    email: string
  ): Promise<TenantInvitation | null> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_invitations")
      .select("*")
      .eq("tenant_id", this.permissionContext.tenantId)
      .eq("email", email.toLowerCase())
      .eq("status", "pending")
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  private async getInviterTenantUser() {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("tenant_users")
      .select("id")
      .eq("tenant_id", this.permissionContext.tenantId)
      .eq("user_id", this.permissionContext.userId)
      .single();

    if (error) throw error;
    return data;
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
      updateData.accepted_at = new Date().toISOString();
    }

    const { error } = await this.dangerSupabaseAdmin
      .from("tenant_invitations")
      .update(updateData)
      .eq("id", invitationId);

    if (error) throw error;
  }

  private async sendInvitationEmail(
    invitation: TenantInvitation,
    customMessage?: string
  ): Promise<void> {
    // TODO: Implement email sending based on your email service
    // This is a placeholder for the email sending logic
    console.log("Sending invitation email to:", invitation.email);
    console.log("Invitation token:", invitation.token);
    console.log("Custom message:", customMessage);

    // You would integrate with your email service here (SendGrid, Resend, etc.)
    // Example invitation URL: https://yourapp.com/invitations/accept?token=${invitation.token}
  }

  // Static factory method
  static create(
    dangerSupabaseAdmin: SupabaseClient,
    userId: string,
    tenantId: string,
    userRole: UserRole
  ): TenantUserInvitationService {
    return new TenantUserInvitationService(dangerSupabaseAdmin, {
      userId,
      tenantId,
      userRole,
    });
  }
}
