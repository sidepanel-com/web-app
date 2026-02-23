import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as platformSchema from "@db/platform/schema";
import * as ledgerSchema from "@db/ledger/schema";
import * as permissionsSchema from "@db/permissions/schema";
import * as packagesSchema from "@db/packages/schema";

/**
 * This file provides compatibility helpers for the Tables<"table_name"> pattern
 * used throughout the codebase, mapping them to Drizzle types.
 */

const allTables = {
  // Platform tables
  tenants: platformSchema.tenants,
  tenant_users: platformSchema.tenantUsers,
  user_profiles: platformSchema.userProfiles,
  tenant_invitations: platformSchema.tenantInvitations,

  // Ledger tables
  people: ledgerSchema.people,
  companies: ledgerSchema.companies,
  company_domains: ledgerSchema.companyDomains,
  company_websites: ledgerSchema.companyWebsites,
  people_companies: ledgerSchema.peopleCompanies,
  comms: ledgerSchema.comms,
  comms_people: ledgerSchema.commsPeople,
  comms_companies: ledgerSchema.commsCompanies,
  emails: ledgerSchema.emails,
  email_comms: ledgerSchema.emailComms,
  meetings: ledgerSchema.meetings,
  meetings_comms: ledgerSchema.meetingsComms,
  calls: ledgerSchema.calls,
  call_comms: ledgerSchema.callComms,
  messages: ledgerSchema.messages,
  message_comms: ledgerSchema.messageComms,
  activities: ledgerSchema.activities,

  // Permissions tables
  member_profiles: permissionsSchema.memberProfiles,
  org_units: permissionsSchema.orgUnits,
  member_profile_org_units: permissionsSchema.memberProfileOrgUnits,

  // Packages tables
  workspace_threads: packagesSchema.workspaceThreads,
  workspace_thread_assignments: packagesSchema.workspaceThreadAssignments,
};

export type TableName = keyof typeof allTables;

export type Tables<T extends TableName> = InferSelectModel<
  (typeof allTables)[T]
>;
export type TablesInsert<T extends TableName> = InferInsertModel<
  (typeof allTables)[T]
>;
export type TablesUpdate<T extends TableName> = Partial<
  InferInsertModel<(typeof allTables)[T]>
>;

export type Enums<T extends keyof EnumsMap> = EnumsMap[T];

interface EnumsMap {
  invitation_status: (typeof platformSchema.invitationStatus.enumValues)[number];
  subscription_tier: (typeof platformSchema.subscriptionTier.enumValues)[number];
  tenant_status: (typeof platformSchema.tenantStatus.enumValues)[number];
  tenant_user_role: (typeof platformSchema.tenantUserRole.enumValues)[number];
  tenant_user_status: (typeof platformSchema.tenantUserStatus.enumValues)[number];
  user_role: (typeof platformSchema.tenantUserRole.enumValues)[number];
  user_status: (typeof platformSchema.tenantUserStatus.enumValues)[number];
  comm_type: (typeof ledgerSchema.commType.enumValues)[number];
  activity_type: (typeof ledgerSchema.activityType.enumValues)[number];
  access_level: (typeof ledgerSchema.accessLevel.enumValues)[number];
}
