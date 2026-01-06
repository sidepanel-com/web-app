import { relations } from "drizzle-orm";
import {
  people,
  companies,
  peopleCompanies,
  comms,
  commsPeople,
  commsCompanies,
  emails,
  emailComms,
  meetings,
  meetingsComms,
  calls,
  callComms,
  messages,
  messageComms,
  companyDomains,
  companyWebsites,
} from "./schema";
import { tenants } from "../platform/schema";

export const peopleRelations = relations(people, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [people.tenantId],
    references: [tenants.id],
  }),
  companies: many(peopleCompanies),
  comms: many(commsPeople),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [companies.tenantId],
    references: [tenants.id],
  }),
  people: many(peopleCompanies),
  comms: many(commsCompanies),
  domains: many(companyDomains),
  websites: many(companyWebsites),
}));

export const peopleCompaniesRelations = relations(
  peopleCompanies,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [peopleCompanies.tenantId],
      references: [tenants.id],
    }),
    person: one(people, {
      fields: [peopleCompanies.personId],
      references: [people.id],
    }),
    company: one(companies, {
      fields: [peopleCompanies.companyId],
      references: [companies.id],
    }),
  })
);

export const companyDomainsRelations = relations(companyDomains, ({ one }) => ({
  tenant: one(tenants, {
    fields: [companyDomains.tenantId],
    references: [tenants.id],
  }),
  company: one(companies, {
    fields: [companyDomains.companyId],
    references: [companies.id],
  }),
}));

export const companyWebsitesRelations = relations(
  companyWebsites,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [companyWebsites.tenantId],
      references: [tenants.id],
    }),
    company: one(companies, {
      fields: [companyWebsites.companyId],
      references: [companies.id],
    }),
  })
);

export const commsRelations = relations(comms, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [comms.tenantId],
    references: [tenants.id],
  }),
  people: many(commsPeople),
  companies: many(commsCompanies),
  emailLinks: many(emailComms),
  meetingLinks: many(meetingsComms),
  callLinks: many(callComms),
  messageLinks: many(messageComms),
}));

export const commsPeopleRelations = relations(commsPeople, ({ one }) => ({
  tenant: one(tenants, {
    fields: [commsPeople.tenantId],
    references: [tenants.id],
  }),
  comm: one(comms, {
    fields: [commsPeople.commId],
    references: [comms.id],
  }),
  person: one(people, {
    fields: [commsPeople.personId],
    references: [people.id],
  }),
}));

export const commsCompaniesRelations = relations(commsCompanies, ({ one }) => ({
  tenant: one(tenants, {
    fields: [commsCompanies.tenantId],
    references: [tenants.id],
  }),
  comm: one(comms, {
    fields: [commsCompanies.commId],
    references: [comms.id],
  }),
  company: one(companies, {
    fields: [commsCompanies.companyId],
    references: [companies.id],
  }),
}));

export const emailsRelations = relations(emails, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [emails.tenantId],
    references: [tenants.id],
  }),
  participants: many(emailComms),
}));

export const emailCommsRelations = relations(emailComms, ({ one }) => ({
  tenant: one(tenants, {
    fields: [emailComms.tenantId],
    references: [tenants.id],
  }),
  email: one(emails, {
    fields: [emailComms.emailId],
    references: [emails.id],
  }),
  comm: one(comms, {
    fields: [emailComms.commId],
    references: [comms.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [meetings.tenantId],
    references: [tenants.id],
  }),
  participants: many(meetingsComms),
}));

export const meetingsCommsRelations = relations(meetingsComms, ({ one }) => ({
  tenant: one(tenants, {
    fields: [meetingsComms.tenantId],
    references: [tenants.id],
  }),
  meeting: one(meetings, {
    fields: [meetingsComms.meetingId],
    references: [meetings.id],
  }),
  comm: one(comms, {
    fields: [meetingsComms.commId],
    references: [comms.id],
  }),
}));

export const callsRelations = relations(calls, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [calls.tenantId],
    references: [tenants.id],
  }),
  participants: many(callComms),
}));

export const callCommsRelations = relations(callComms, ({ one }) => ({
  tenant: one(tenants, {
    fields: [callComms.tenantId],
    references: [tenants.id],
  }),
  call: one(calls, {
    fields: [callComms.callId],
    references: [calls.id],
  }),
  comm: one(comms, {
    fields: [callComms.commId],
    references: [comms.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [messages.tenantId],
    references: [tenants.id],
  }),
  participants: many(messageComms),
}));

export const messageCommsRelations = relations(messageComms, ({ one }) => ({
  tenant: one(tenants, {
    fields: [messageComms.tenantId],
    references: [tenants.id],
  }),
  message: one(messages, {
    fields: [messageComms.messageId],
    references: [messages.id],
  }),
  comm: one(comms, {
    fields: [messageComms.commId],
    references: [comms.id],
  }),
}));
