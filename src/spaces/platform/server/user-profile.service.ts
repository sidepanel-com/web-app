import { SupabaseClient } from "@supabase/supabase-js";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { BaseEntityService, PermissionContext } from "./base-entity.service";

type UserProfile = Tables<"user_profiles">;

export interface UserProfileUpdate {
  displayName?: string;
  timezone?: string;
}

export interface UserProfileWithAuth extends UserProfile {
  email_confirmed_at?: string;
}

export class UserProfileService extends BaseEntityService {
  private dangerSupabaseAdmin: SupabaseClient;

  constructor(
    db: any,
    dangerSupabaseAdmin: SupabaseClient,
    permissionContext: PermissionContext
  ) {
    super(db, permissionContext);
    this.dangerSupabaseAdmin = dangerSupabaseAdmin;
  }

  // Permission checks
  async canRead(entityId?: string): Promise<boolean> {
    // Users can always read their own profile
    if (entityId) {
      const profile = await this.findById(entityId);
      if (profile?.userId === this.permissionContext.userId) {
        return true;
      }
    }

    // Check if user has permission to read other profiles
    return await this.hasPermission("read_user_profiles");
  }

  async canCreate(): Promise<boolean> {
    // Users can create their own profile, admins can create any profile
    return true;
  }

  async canUpdate(entityId: string): Promise<boolean> {
    // Users can update their own profile
    const profile = await this.findById(entityId);
    if (profile?.userId === this.permissionContext.userId) {
      return true;
    }

    // Check if user has permission to update other profiles
    return await this.hasPermission("manage_user_profiles");
  }

  async canDelete(entityId: string): Promise<boolean> {
    // Only system admins can delete profiles (rarely needed)
    return await this.hasPermission("delete_user_profiles");
  }

  /**
   * Get user profile by user ID
   */
  async getProfileByUserId(userId?: string): Promise<UserProfile | null> {
    const targetUserId = userId || this.permissionContext.userId;

    const { data, error } = await this.dangerSupabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  /**
   * Get user profile with auth information
   */
  async getProfileWithAuth(
    userId?: string
  ): Promise<UserProfileWithAuth | null> {
    const targetUserId = userId || this.permissionContext.userId;

    if (!(await this.canRead())) {
      throw new Error("Insufficient permissions to read user profile");
    }

    const profile = await this.getProfileByUserId(targetUserId);
    if (!profile) return null;

    // Get auth information
    const { data: authUser, error: authError } =
      await this.dangerSupabaseAdmin.auth.admin.getUserById(targetUserId);

    if (authError) {
      // Return profile without auth info if auth lookup fails
      return profile;
    }

    return {
      ...profile,
      email: authUser.user?.email || profile.email,
      email_confirmed_at: authUser.user?.email_confirmed_at,
    };
  }

  /**
   * Create or update user profile
   */
  async upsertProfile(
    profileData: UserProfileUpdate,
    userId?: string
  ): Promise<UserProfile> {
    const targetUserId = userId || this.permissionContext.userId;

    // Check if profile exists
    const existingProfile = await this.getProfileByUserId(targetUserId);

    if (existingProfile) {
      return await this.updateProfile(existingProfile.id, profileData);
    } else {
      return await this.createProfile(profileData, targetUserId);
    }
  }

  /**
   * Create a new user profile
   */
  async createProfile(
    profileData: UserProfileUpdate,
    userId?: string
  ): Promise<UserProfile> {
    const targetUserId = userId || this.permissionContext.userId;

    if (!(await this.canCreate())) {
      throw new Error("Insufficient permissions to create user profile");
    }

    const profileInsert: TablesInsert<"user_profiles"> = {
      userId: targetUserId,
      email: (await this.dangerSupabaseAdmin.auth.admin.getUserById(targetUserId)).data.user?.email || "",
      displayName: profileData.displayName || null,
      timezone: profileData.timezone || "UTC",
    };

    const { data, error } = await this.dangerSupabaseAdmin
      .from("user_profiles")
      .insert(profileInsert)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    profileId: string,
    profileData: UserProfileUpdate
  ): Promise<UserProfile> {
    if (!(await this.canUpdate(profileId))) {
      throw new Error("Insufficient permissions to update user profile");
    }

    const profileUpdate: TablesUpdate<"user_profiles"> = {
      ...profileData,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await this.dangerSupabaseAdmin
      .from("user_profiles")
      .update(profileUpdate)
      .eq("id", profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update user preferences
   * @deprecated preferences column missing in schema
   */
  async updatePreferences(
    preferences: Record<string, any>,
    userId?: string
  ): Promise<UserProfile> {
    throw new Error("Preferences not supported in current schema");
  }

  /**
   * Update avatar URL
   * @deprecated avatar_url column missing in schema
   */
  async updateAvatar(avatarUrl: string, userId?: string): Promise<UserProfile> {
    throw new Error("Avatar not supported in current schema");
  }

  /**
   * Get user's display name
   */
  async getDisplayName(userId?: string): Promise<string> {
    const targetUserId = userId || this.permissionContext.userId;
    const profile = await this.getProfileByUserId(targetUserId);

    if (!profile) {
      // Fallback to email if no profile
      const { data: authUser } =
        await this.dangerSupabaseAdmin.auth.admin.getUserById(targetUserId);
      return authUser.user?.email?.split("@")[0] || "Unknown User";
    }

    if (profile.displayName) {
      return profile.displayName;
    }

    // Fallback to email
    const { data: authUser } =
      await this.dangerSupabaseAdmin.auth.admin.getUserById(targetUserId);
    return authUser.user?.email?.split("@")[0] || "Unknown User";
  }

  /**
   * Delete user profile
   */
  async deleteProfile(profileId: string): Promise<void> {
    if (!(await this.canDelete(profileId))) {
      throw new Error("Insufficient permissions to delete user profile");
    }

    const { error } = await this.dangerSupabaseAdmin
      .from("user_profiles")
      .delete()
      .eq("id", profileId);

    if (error) throw error;
  }

  /**
   * Get profile by ID
   */
  private async findById(id: string): Promise<UserProfile | null> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  /**
   * Search profiles by name or email (for admin use)
   */
  async searchProfiles(
    query: string,
    limit: number = 10
  ): Promise<UserProfileWithAuth[]> {
    if (!(await this.hasPermission("read_user_profiles"))) {
      throw new Error("Insufficient permissions to search user profiles");
    }

    // Search by name
    const { data: profiles, error } = await this.dangerSupabaseAdmin
      .from("user_profiles")
      .select("*")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;

    // Enhance with auth data
    const profilesWithAuth = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: authUser } =
          await this.dangerSupabaseAdmin.auth.admin.getUserById(
            profile.userId
          );
        return {
          ...profile,
          email: authUser.user?.email,
          email_confirmed_at: authUser.user?.email_confirmed_at,
        };
      })
    );

    return profilesWithAuth;
  }

  // Static factory method
  static create(
    db: any,
    dangerSupabaseAdmin: SupabaseClient,
    userId: string
  ): UserProfileService {
    return new UserProfileService(db, dangerSupabaseAdmin, {
      userId,
    });
  }
}
