import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as platformSchema from "@db/platform/schema";
import * as productSchema from "@db/product/schema";

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

  // Product tables
  people: productSchema.people,
  companies: productSchema.companies,
  company_domains: productSchema.companyDomains,
  company_websites: productSchema.companyWebsites,
  people_companies: productSchema.peopleCompanies,
  comms: productSchema.comms,
  comms_people: productSchema.commsPeople,
  comms_companies: productSchema.commsCompanies,
  emails: productSchema.emails,
  email_comms: productSchema.emailComms,
  meetings: productSchema.meetings,
  meetings_comms: productSchema.meetingsComms,
  calls: productSchema.calls,
  call_comms: productSchema.callComms,
  messages: productSchema.messages,
  message_comms: productSchema.messageComms,
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
  comm_type: (typeof productSchema.commType.enumValues)[number];
}
