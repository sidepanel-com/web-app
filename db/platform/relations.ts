import { relations } from 'drizzle-orm';
import { tenants, tenantUsers, tenantInvitations, userProfiles } from './schema';

/**
 * Tenants
 */
export const tenantsRelations = relations(tenants, ({ many }) => ({
	tenantUsers: many(tenantUsers),
	tenantInvitations: many(tenantInvitations),
}));

/**
 * User Profiles (identity root)
 */
export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
	tenantUsers: many(tenantUsers),
	sentInvitations: many(tenantInvitations, {
		relationName: 'invitedByProfile',
	}),
}));

/**
 * Tenant Users (membership)
 */
export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
	tenant: one(tenants, {
		fields: [tenantUsers.tenantId],
		references: [tenants.id],
	}),
	profile: one(userProfiles, {
		fields: [tenantUsers.profileId],
		references: [userProfiles.id],
	}),
}));

/**
 * Tenant Invitations
 */
export const tenantInvitationsRelations = relations(
	tenantInvitations,
	({ one }) => ({
		tenant: one(tenants, {
			fields: [tenantInvitations.tenantId],
			references: [tenants.id],
		}),
		invitedProfile: one(userProfiles, {
			fields: [tenantInvitations.invitedBy],
			references: [userProfiles.id],
			relationName: 'invitedByProfile',
		}),
	})
);