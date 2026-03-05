import { eq, and } from "drizzle-orm";
import type { DrizzleClient } from "@/spaces/platform/server/db";
import {
  people,
  companies,
  comms,
  peopleCompanies,
  commsPeople,
  commsCompanies,
  companyDomains,
  companyWebsites,
} from "@db/ledger/schema";
import type {
  Person,
  NewPerson,
  NewCompany,
  Comm,
  CompanyDomain,
  CompanyWebsite,
  CompanyWithWeb,
} from "@db/ledger/types";

type PersonUpdate = Partial<
  Omit<Person, "id" | "tenantId" | "createdAt" | "updatedAt">
>;

type CompanyFields = Omit<
  NewCompany,
  "id" | "tenantId" | "createdAt" | "updatedAt"
>;

type CompanyUpdate = Partial<CompanyFields>;

type DomainInput = { domain: string; isPrimary: boolean };
type WebsiteInput = { url: string; type?: string; isPrimary: boolean };

/**
 * Owns all mutations to ledger-schema tables.
 *
 * No permission checks, no normalization — callers are responsible for
 * validating inputs and enforcing access control before invoking these
 * methods.
 */
export class LedgerWriteService {
  constructor(private db: DrizzleClient) {}

  /* ===================== People ===================== */

  async insertPerson(
    tenantId: string,
    data: Omit<NewPerson, "id" | "tenantId" | "createdAt" | "updatedAt">,
  ): Promise<Person> {
    const [row] = await this.db
      .insert(people)
      .values({ ...data, tenantId })
      .returning();
    if (!row) throw new Error("Failed to insert person");
    return row;
  }

  async updatePerson(
    tenantId: string,
    id: string,
    updates: PersonUpdate,
  ): Promise<Person> {
    const [row] = await this.db
      .update(people)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(and(eq(people.id, id), eq(people.tenantId, tenantId)))
      .returning();
    if (!row) throw new Error("Person not found or update failed");
    return row;
  }

  async deletePerson(tenantId: string, id: string): Promise<void> {
    await this.db
      .delete(people)
      .where(and(eq(people.id, id), eq(people.tenantId, tenantId)));
  }

  /* ===================== Companies ===================== */

  async insertCompany(
    tenantId: string,
    data: CompanyFields,
    domains: DomainInput[],
    websites: WebsiteInput[],
  ): Promise<CompanyWithWeb> {
    return await this.db.transaction(async (tx) => {
      const [company] = await tx
        .insert(companies)
        .values({ ...data, tenantId })
        .returning();
      if (!company) throw new Error("Failed to insert company");

      let createdDomains: CompanyDomain[] = [];
      let createdWebsites: CompanyWebsite[] = [];

      if (domains.length > 0) {
        createdDomains = await tx
          .insert(companyDomains)
          .values(
            domains.map((d) => ({
              tenantId,
              companyId: company.id,
              domain: d.domain,
              isPrimary: d.isPrimary,
            })),
          )
          .returning();
      }

      if (websites.length > 0) {
        createdWebsites = await tx
          .insert(companyWebsites)
          .values(
            websites.map((w) => ({
              tenantId,
              companyId: company.id,
              url: w.url,
              type: w.type,
              isPrimary: w.isPrimary,
            })),
          )
          .returning();
      }

      return { ...company, domains: createdDomains, websites: createdWebsites };
    });
  }

  async updateCompany(
    tenantId: string,
    id: string,
    updates: CompanyUpdate,
    domains?: DomainInput[],
    websites?: WebsiteInput[],
  ): Promise<CompanyWithWeb> {
    return await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(companies)
        .set({ ...updates, updatedAt: new Date().toISOString() })
        .where(and(eq(companies.id, id), eq(companies.tenantId, tenantId)))
        .returning();
      if (!updated) throw new Error("Company not found or update failed");

      let finalDomains: CompanyDomain[];
      if (domains !== undefined) {
        await tx
          .delete(companyDomains)
          .where(
            and(
              eq(companyDomains.tenantId, tenantId),
              eq(companyDomains.companyId, id),
            ),
          );
        finalDomains =
          domains.length > 0
            ? await tx
                .insert(companyDomains)
                .values(
                  domains.map((d) => ({
                    tenantId,
                    companyId: id,
                    domain: d.domain,
                    isPrimary: d.isPrimary,
                  })),
                )
                .returning()
            : [];
      } else {
        finalDomains = await tx
          .select()
          .from(companyDomains)
          .where(
            and(
              eq(companyDomains.tenantId, tenantId),
              eq(companyDomains.companyId, id),
            ),
          );
      }

      let finalWebsites: CompanyWebsite[];
      if (websites !== undefined) {
        await tx
          .delete(companyWebsites)
          .where(
            and(
              eq(companyWebsites.tenantId, tenantId),
              eq(companyWebsites.companyId, id),
            ),
          );
        finalWebsites =
          websites.length > 0
            ? await tx
                .insert(companyWebsites)
                .values(
                  websites.map((w) => ({
                    tenantId,
                    companyId: id,
                    url: w.url,
                    type: w.type,
                    isPrimary: w.isPrimary,
                  })),
                )
                .returning()
            : [];
      } else {
        finalWebsites = await tx
          .select()
          .from(companyWebsites)
          .where(
            and(
              eq(companyWebsites.tenantId, tenantId),
              eq(companyWebsites.companyId, id),
            ),
          );
      }

      return { ...updated, domains: finalDomains, websites: finalWebsites };
    });
  }

  async deleteCompany(tenantId: string, id: string): Promise<void> {
    await this.db
      .delete(companies)
      .where(and(eq(companies.id, id), eq(companies.tenantId, tenantId)));
  }

  /* ===================== Comms ===================== */

  /**
   * Find an existing comm by canonical value or create one.
   * Maintains the unique constraint (tenant_id, type, canonical_value).
   */
  async findOrCreateComm(
    tenantId: string,
    type: string,
    value: unknown,
    canonicalValue: string,
  ): Promise<Comm> {
    const [existing] = await this.db
      .select()
      .from(comms)
      .where(
        and(
          eq(comms.tenantId, tenantId),
          eq(comms.type, type as typeof comms.type.enumValues[number]),
          eq(comms.canonicalValue, canonicalValue),
        ),
      )
      .limit(1);

    if (existing) return existing;

    const [created] = await this.db
      .insert(comms)
      .values({
        tenantId,
        type: type as typeof comms.type.enumValues[number],
        value,
        canonicalValue,
      })
      .returning();
    if (!created) throw new Error("Failed to create comm");
    return created;
  }

  /* ===================== People ↔ Companies ===================== */

  async linkPersonCompany(
    tenantId: string,
    personId: string,
    companyId: string,
    role?: string,
    isPrimary?: boolean,
  ): Promise<void> {
    await this.db.insert(peopleCompanies).values({
      tenantId,
      personId,
      companyId,
      role,
      isPrimary: isPrimary ?? false,
      startAt: new Date().toISOString(),
    });
  }

  async unlinkPersonCompany(
    tenantId: string,
    personId: string,
    companyId: string,
  ): Promise<void> {
    await this.db
      .delete(peopleCompanies)
      .where(
        and(
          eq(peopleCompanies.tenantId, tenantId),
          eq(peopleCompanies.personId, personId),
          eq(peopleCompanies.companyId, companyId),
        ),
      );
  }

  /* ===================== Comms ↔ People ===================== */

  async linkCommPerson(
    tenantId: string,
    commId: string,
    personId: string,
  ): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(commsPeople)
      .where(
        and(
          eq(commsPeople.tenantId, tenantId),
          eq(commsPeople.personId, personId),
          eq(commsPeople.commId, commId),
        ),
      )
      .limit(1);

    if (!existing) {
      await this.db.insert(commsPeople).values({
        tenantId,
        personId,
        commId,
        startAt: new Date().toISOString(),
      });
    }
  }

  async unlinkCommPerson(
    tenantId: string,
    commId: string,
    personId: string,
  ): Promise<void> {
    await this.db
      .delete(commsPeople)
      .where(
        and(
          eq(commsPeople.tenantId, tenantId),
          eq(commsPeople.personId, personId),
          eq(commsPeople.commId, commId),
        ),
      );
  }

  /* ===================== Comms ↔ Companies ===================== */

  async linkCommCompany(
    tenantId: string,
    commId: string,
    companyId: string,
  ): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(commsCompanies)
      .where(
        and(
          eq(commsCompanies.tenantId, tenantId),
          eq(commsCompanies.companyId, companyId),
          eq(commsCompanies.commId, commId),
        ),
      )
      .limit(1);

    if (!existing) {
      await this.db.insert(commsCompanies).values({
        tenantId,
        companyId,
        commId,
      });
    }
  }

  async unlinkCommCompany(
    tenantId: string,
    commId: string,
    companyId: string,
  ): Promise<void> {
    await this.db
      .delete(commsCompanies)
      .where(
        and(
          eq(commsCompanies.tenantId, tenantId),
          eq(commsCompanies.companyId, companyId),
          eq(commsCompanies.commId, commId),
        ),
      );
  }
}
