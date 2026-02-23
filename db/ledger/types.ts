import type {
  activities,
  callComms,
  calls,
  comms,
  commsCompanies,
  commsPeople,
  companies,
  companyDomains,
  companyWebsites,
  emailComms,
  emails,
  meetings,
  meetingsComms,
  messageComms,
  messages,
  people,
  peopleCompanies,
} from "./schema";

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type CompanyDomain = typeof companyDomains.$inferSelect;
export type NewCompanyDomain = typeof companyDomains.$inferInsert;

export type CompanyWebsite = typeof companyWebsites.$inferSelect;
export type NewCompanyWebsite = typeof companyWebsites.$inferInsert;

export type CompanyWithWeb = Company & {
  domains: CompanyDomain[];
  websites: CompanyWebsite[];
};

export type PersonCompany = typeof peopleCompanies.$inferSelect;
export type NewPersonCompany = typeof peopleCompanies.$inferInsert;

export type Comm = typeof comms.$inferSelect;
export type NewComm = typeof comms.$inferInsert;

export type CommPerson = typeof commsPeople.$inferSelect;
export type NewCommPerson = typeof commsPeople.$inferInsert;

export type CommCompany = typeof commsCompanies.$inferSelect;
export type NewCommCompany = typeof commsCompanies.$inferInsert;

export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;

export type EmailComm = typeof emailComms.$inferSelect;
export type NewEmailComm = typeof emailComms.$inferInsert;

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;

export type MeetingComm = typeof meetingsComms.$inferSelect;
export type NewMeetingComm = typeof meetingsComms.$inferInsert;

export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;

export type CallComm = typeof callComms.$inferSelect;
export type NewCallComm = typeof callComms.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type MessageComm = typeof messageComms.$inferSelect;
export type NewMessageComm = typeof messageComms.$inferInsert;

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
