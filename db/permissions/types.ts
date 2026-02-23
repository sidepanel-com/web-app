import type { memberProfileOrgUnits, memberProfiles, orgUnits } from "./schema";

export type MemberProfile = typeof memberProfiles.$inferSelect;
export type NewMemberProfile = typeof memberProfiles.$inferInsert;

export type OrgUnit = typeof orgUnits.$inferSelect;
export type NewOrgUnit = typeof orgUnits.$inferInsert;

export type MemberProfileOrgUnit = typeof memberProfileOrgUnits.$inferSelect;
export type NewMemberProfileOrgUnit = typeof memberProfileOrgUnits.$inferInsert;
