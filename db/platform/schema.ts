import {
    pgSchema,
    uuid,
    text,
    timestamp,
    uniqueIndex,
    foreignKey,
    unique,
    index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const platform = pgSchema('platform');

export const invitationStatus = platform.enum("invitation_status", ['pending', 'accepted', 'declined', 'expired'])
export const subscriptionTier = platform.enum("subscription_tier", ['free', 'basic', 'premium', 'enterprise'])
export const tenantStatus = platform.enum("tenant_status", ['active', 'inactive', 'suspended'])
export const tenantUserRole = platform.enum("tenant_user_role", ['owner', 'admin', 'member', 'viewer'])
export const tenantUserStatus = platform.enum("tenant_user_status", ['active', 'inactive', 'pending'])


/**
 * User profiles (ONLY table that touches auth.users)
 */
export const userProfiles = platform.table(
    'user_profiles',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id').notNull(), // auth.users.id (1:1)
        email: text('email').notNull(), // snapshot
        displayName: text('display_name'),
        timezone: text('timezone').notNull().default('UTC'),
        deactivatedAt: timestamp('deactivated_at', { withTimezone: true, mode: 'string' }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull().$onUpdate(() => sql`now()`),
    },
    (t) => ([
        // UNIQUE on supabase auth user 1:1
        uniqueIndex('user_profiles_user_id_unique').on(t.userId),
        // MANUAL FK (do NOT use .references())
        sql`
      FOREIGN KEY (${t.userId})
      REFERENCES auth.users(id)
      ON DELETE RESTRICT
    `,
    ])
);

/**
 * Tenants (accounts / orgs)
 */
export const tenants = platform.table('tenants', {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    status: tenantStatus().default('active'),
    subscriptionTier: subscriptionTier("subscription_tier").default('free'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull().$onUpdate(() => sql`now()`),
}, (t) => ([
    uniqueIndex('tenants_slug_unique').on(t.slug),
]));

/*
 * Tenant Users
 */
export const tenantUsers =  platform.table('tenant_users', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    profileId: uuid('profile_id').notNull(),
    role: tenantUserRole().notNull(),
    status: tenantUserStatus().default('active'),
    invitedBy: uuid('invited_by'),
    invitedByEmail: text('invited_by_email'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull().$onUpdate(() => sql`now()`),
}, (t) => ([
    uniqueIndex('tenant_users_tenant_id_user_id_unique').on(t.tenantId, t.profileId),
    foreignKey({
        columns: [t.tenantId],
        foreignColumns: [tenants.id],
        name: 'tenant_users_tenant_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
        columns: [t.profileId],
        foreignColumns: [userProfiles.id],
        name: 'tenant_users_profile_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
        columns: [t.invitedBy],
        foreignColumns: [userProfiles.id],
        name: 'tenant_users_invited_by_fkey'
    }).onDelete('set null'),
]));

/*
 * Tenant Invitations
 */
export const tenantInvitations = platform.table('tenant_invitations', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    profileId: uuid('profile_id').notNull(),
    role: tenantUserRole().notNull(),
    status: tenantUserStatus().default('active'),
    invitedBy: uuid('invited_by'),
    invitedByEmail: text('invited_by_email'),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull().$onUpdate(() => sql`now()`),
}, (t) => ([
    unique("tenant_invitations_token_key").on(t.token),
    index('tenant_invitations_tenant_id_idx').on(t.tenantId),
    index('tenant_invitations_profile_id_idx').on(t.profileId),
    foreignKey({
        columns: [t.tenantId],
        foreignColumns: [tenants.id],
        name: 'tenant_invitations_tenant_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
        columns: [t.profileId],
        foreignColumns: [userProfiles.id],
        name: 'tenant_invitations_profile_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
        columns: [t.invitedBy],
        foreignColumns: [userProfiles.id],
        name: 'tenant_invitations_invited_by_fkey'
    }).onDelete('set null'),
]));
