import { eq, and, inArray } from "drizzle-orm";
import type { db } from "@/spaces/platform/server/db";
import {
  people,
  peopleCompanies,
  comms,
  commsPeople,
  companies,
  companyDomains,
  companyWebsites,
} from "@db/product/schema";
import {
  BaseEntityService,
  type PermissionContext,
} from "@/spaces/platform/server/base-entity.service";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  normalizeComm,
  type CommType,
} from "@/spaces/product/lib/comm-validation";
import {
  normalizeDomain,
  isValidDomain,
  tryNormalizeWebsiteUrl,
} from "@/spaces/product/lib/company-validation";

type Person = InferSelectModel<typeof people>;
type NewPerson = InferInsertModel<typeof people>;
type PersonUpdate = Partial<
  Omit<Person, "id" | "tenantId" | "createdAt" | "updatedAt">
>;

type Company = InferSelectModel<typeof companies>;
type NewCompany = InferInsertModel<typeof companies>;
type Comm = InferSelectModel<typeof comms>;
type NewComm = InferInsertModel<typeof comms>;

type CompanyDomain = InferSelectModel<typeof companyDomains>;
type CompanyWebsite = InferSelectModel<typeof companyWebsites>;
type CompanyWithWeb = Company & {
  domains: CompanyDomain[];
  websites: CompanyWebsite[];
};

type CompanyCreateInput = Omit<
  NewCompany,
  "id" | "tenantId" | "createdAt" | "updatedAt"
> & {
  domains?: Array<{ domain: string; isPrimary?: boolean }>;
  websites?: Array<{ url: string; type?: string; isPrimary?: boolean }>;
};

function normalizeDomainEntries(input: CompanyCreateInput["domains"]) {
  const seen = new Set<string>();
  const result: Array<{ domain: string; isPrimary: boolean }> = [];

  for (const item of input ?? []) {
    if (!item.domain?.trim()) continue;
    if (!isValidDomain(item.domain)) {
      throw new Error(`Invalid domain: ${item.domain}`);
    }
    const domain = normalizeDomain(item.domain);
    if (!domain) continue;
    if (seen.has(domain)) continue;
    seen.add(domain);
    result.push({ domain, isPrimary: !!item.isPrimary });
  }

  const primaryIdx = result.findIndex((d) => d.isPrimary);
  if (result.length > 0) {
    if (primaryIdx === -1) result[0]!.isPrimary = true;
    else {
      for (let i = 0; i < result.length; i++)
        result[i]!.isPrimary = i === primaryIdx;
    }
  }

  return result;
}

function normalizeWebsiteEntries(input: CompanyCreateInput["websites"]) {
  const seen = new Set<string>();
  const result: Array<{ url: string; type?: string; isPrimary: boolean }> = [];

  for (const item of input ?? []) {
    if (!item.url?.trim()) continue;
    const normalized = tryNormalizeWebsiteUrl(item.url);
    if (!normalized) {
      throw new Error(`Invalid website URL: ${item.url}`);
    }
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push({
      url: normalized,
      type: item.type?.trim() || undefined,
      isPrimary: !!item.isPrimary,
    });
  }

  const primaryIdx = result.findIndex((w) => w.isPrimary);
  if (result.length > 0) {
    if (primaryIdx === -1) result[0]!.isPrimary = true;
    else {
      for (let i = 0; i < result.length; i++)
        result[i]!.isPrimary = i === primaryIdx;
    }
  }

  return result;
}

export class PeopleService extends BaseEntityService {
  constructor(drizzleClient: typeof db, permissionContext: PermissionContext) {
    super(drizzleClient, permissionContext);
  }

  async canRead(personId?: string): Promise<boolean> {
    // For now, if you are in the tenant, you can read people
    return !!this.permissionContext.tenantId;
  }

  async canCreate(): Promise<boolean> {
    return await this.hasPermission("create");
  }

  async canUpdate(personId: string): Promise<boolean> {
    return await this.hasPermission("update");
  }

  async canDelete(personId: string): Promise<boolean> {
    return await this.hasPermission("delete");
  }

  async getPeople(): Promise<Person[]> {
    if (!this.permissionContext.tenantId) {
      throw new Error("Tenant ID is required to fetch people");
    }

    if (!(await this.canRead())) {
      throw new Error("Insufficient permissions to read people");
    }

    return await this.db
      .select()
      .from(people)
      .where(eq(people.tenantId, this.permissionContext.tenantId));
  }

  async getPersonById(
    id: string
  ): Promise<(Person & { companies: CompanyWithWeb[]; comms: Comm[] }) | null> {
    if (!this.permissionContext.tenantId) {
      throw new Error("Tenant ID is required to fetch a person");
    }

    if (!(await this.canRead(id))) {
      throw new Error("Insufficient permissions to read this person");
    }

    const [person] = await this.db
      .select()
      .from(people)
      .where(
        and(
          eq(people.id, id),
          eq(people.tenantId, this.permissionContext.tenantId)
        )
      );

    if (!person) return null;

    const personCompaniesList = await this.db
      .select({
        company: companies,
      })
      .from(peopleCompanies)
      .innerJoin(companies, eq(peopleCompanies.companyId, companies.id))
      .where(
        and(
          eq(peopleCompanies.tenantId, this.permissionContext.tenantId),
          eq(peopleCompanies.personId, id)
        )
      );

    const linkedCompanies = personCompaniesList.map((pc) => pc.company);
    const companyIds = linkedCompanies.map((c) => c.id);

    const [domains, websites] =
      companyIds.length > 0
        ? await Promise.all([
            this.db
              .select()
              .from(companyDomains)
              .where(
                and(
                  eq(companyDomains.tenantId, this.permissionContext.tenantId),
                  inArray(companyDomains.companyId, companyIds)
                )
              ),
            this.db
              .select()
              .from(companyWebsites)
              .where(
                and(
                  eq(companyWebsites.tenantId, this.permissionContext.tenantId),
                  inArray(companyWebsites.companyId, companyIds)
                )
              ),
          ])
        : [[], []];

    const domainsByCompany = new Map<string, CompanyDomain[]>();
    for (const d of domains as CompanyDomain[]) {
      const arr = domainsByCompany.get(d.companyId) ?? [];
      arr.push(d);
      domainsByCompany.set(d.companyId, arr);
    }

    const websitesByCompany = new Map<string, CompanyWebsite[]>();
    for (const w of websites as CompanyWebsite[]) {
      const arr = websitesByCompany.get(w.companyId) ?? [];
      arr.push(w);
      websitesByCompany.set(w.companyId, arr);
    }

    const personCommsList = await this.db
      .select({
        comm: comms,
      })
      .from(commsPeople)
      .innerJoin(comms, eq(commsPeople.commId, comms.id))
      .where(
        and(
          eq(commsPeople.tenantId, this.permissionContext.tenantId),
          eq(commsPeople.personId, id)
        )
      );

    return {
      ...person,
      companies: linkedCompanies.map((c) => ({
        ...c,
        domains: domainsByCompany.get(c.id) ?? [],
        websites: websitesByCompany.get(c.id) ?? [],
      })),
      comms: personCommsList.map((pc) => pc.comm),
    };
  }

  async createPerson(
    data: Omit<NewPerson, "id" | "tenantId" | "createdAt" | "updatedAt">
  ): Promise<Person> {
    if (!this.permissionContext.tenantId) {
      throw new Error("Tenant ID is required to create a person");
    }

    if (!(await this.canCreate())) {
      throw new Error("Insufficient permissions to create a person");
    }

    const [person] = await this.db
      .insert(people)
      .values({
        ...data,
        tenantId: this.permissionContext.tenantId,
      })
      .returning();

    if (!person) throw new Error("Failed to create person");

    return person;
  }

  async updatePerson(id: string, updates: PersonUpdate): Promise<Person> {
    if (!this.permissionContext.tenantId) {
      throw new Error("Tenant ID is required to update a person");
    }

    if (!(await this.canUpdate(id))) {
      throw new Error("Insufficient permissions to update this person");
    }

    const [updated] = await this.db
      .update(people)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(people.id, id),
          eq(people.tenantId, this.permissionContext.tenantId)
        )
      )
      .returning();

    if (!updated) throw new Error("Person not found or update failed");

    return updated;
  }

  async deletePerson(id: string): Promise<void> {
    if (!this.permissionContext.tenantId) {
      throw new Error("Tenant ID is required to delete a person");
    }

    if (!(await this.canDelete(id))) {
      throw new Error("Insufficient permissions to delete this person");
    }

    const result = await this.db
      .delete(people)
      .where(
        and(
          eq(people.id, id),
          eq(people.tenantId, this.permissionContext.tenantId)
        )
      );

    // Drizzle delete result handling varies by driver, but standard returning() or just awaiting is common.
  }

  /* =========================
     ASSOCIATIONS (COMPANIES)
  ========================= */

  async addCompanyLink(
    personId: string,
    companyId: string,
    role?: string,
    isPrimary?: boolean
  ): Promise<void> {
    if (!this.permissionContext.tenantId)
      throw new Error("Tenant ID is required");

    await this.db.insert(peopleCompanies).values({
      tenantId: this.permissionContext.tenantId,
      personId,
      companyId,
      role,
      isPrimary: isPrimary ?? false,
    });
  }

  async removeCompanyLink(personId: string, companyId: string): Promise<void> {
    if (!this.permissionContext.tenantId)
      throw new Error("Tenant ID is required");

    await this.db
      .delete(peopleCompanies)
      .where(
        and(
          eq(peopleCompanies.tenantId, this.permissionContext.tenantId),
          eq(peopleCompanies.personId, personId),
          eq(peopleCompanies.companyId, companyId)
        )
      );
  }

  async createAndLinkCompany(
    personId: string,
    data: CompanyCreateInput,
    role?: string,
    isPrimary?: boolean
  ): Promise<Company> {
    if (!this.permissionContext.tenantId)
      throw new Error("Tenant ID is required");

    const normalizedDomains = normalizeDomainEntries(data.domains);
    const normalizedWebsites = normalizeWebsiteEntries(data.websites);
    const { domains: _domains, websites: _websites, ...companyData } = data;

    const company = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(companies)
        .values({
          ...companyData,
          tenantId: this.permissionContext.tenantId,
        })
        .returning();

      if (!created) throw new Error("Failed to create company");

      if (normalizedDomains.length > 0) {
        await tx.insert(companyDomains).values(
          normalizedDomains.map((d) => ({
            tenantId: this.permissionContext.tenantId!,
            companyId: created.id,
            domain: d.domain,
            isPrimary: d.isPrimary,
          }))
        );
      }

      if (normalizedWebsites.length > 0) {
        await tx.insert(companyWebsites).values(
          normalizedWebsites.map((w) => ({
            tenantId: this.permissionContext.tenantId!,
            companyId: created.id,
            url: w.url,
            type: w.type,
            isPrimary: w.isPrimary,
          }))
        );
      }

      return created;
    });

    await this.addCompanyLink(personId, company.id, role, isPrimary);

    return company;
  }

  /* =========================
     ASSOCIATIONS (COMMS)
  ========================= */

  async addCommLink(personId: string, commId: string): Promise<void> {
    if (!this.permissionContext.tenantId)
      throw new Error("Tenant ID is required");

    // Check if link already exists
    const [existingLink] = await this.db
      .select()
      .from(commsPeople)
      .where(
        and(
          eq(commsPeople.tenantId, this.permissionContext.tenantId),
          eq(commsPeople.personId, personId),
          eq(commsPeople.commId, commId)
        )
      )
      .limit(1);

    if (!existingLink) {
      await this.db.insert(commsPeople).values({
        tenantId: this.permissionContext.tenantId,
        personId,
        commId,
      });
    }
  }

  async removeCommLink(personId: string, commId: string): Promise<void> {
    if (!this.permissionContext.tenantId)
      throw new Error("Tenant ID is required");

    await this.db
      .delete(commsPeople)
      .where(
        and(
          eq(commsPeople.tenantId, this.permissionContext.tenantId),
          eq(commsPeople.personId, personId),
          eq(commsPeople.commId, commId)
        )
      );
  }

  async createAndLinkComm(
    personId: string,
    data: Omit<
      NewComm,
      "id" | "tenantId" | "createdAt" | "updatedAt" | "canonicalValue"
    >
  ): Promise<Comm> {
    if (!this.permissionContext.tenantId)
      throw new Error("Tenant ID is required");

    // Normalize input first to ensure consistent comparison
    const { value, canonicalValue } = normalizeComm(
      data.type as CommType,
      data.value
    );

    // Try to find existing comm first using normalized canonicalValue
    let [comm] = await this.db
      .select()
      .from(comms)
      .where(
        and(
          eq(comms.tenantId, this.permissionContext.tenantId),
          eq(comms.type, data.type),
          eq(comms.canonicalValue, canonicalValue)
        )
      )
      .limit(1);

    if (!comm) {
      [comm] = await this.db
        .insert(comms)
        .values({
          tenantId: this.permissionContext.tenantId,
          type: data.type,
          value,
          canonicalValue,
        })
        .returning();
    }

    if (!comm) throw new Error("Failed to create or find comm");

    // Check if link already exists
    const [existingLink] = await this.db
      .select()
      .from(commsPeople)
      .where(
        and(
          eq(commsPeople.tenantId, this.permissionContext.tenantId),
          eq(commsPeople.personId, personId),
          eq(commsPeople.commId, comm.id)
        )
      )
      .limit(1);

    if (!existingLink) {
      await this.addCommLink(personId, comm.id);
    }

    return comm;
  }

  static create(
    drizzleClient: typeof db,
    userId: string,
    tenantId: string,
    userRole?: PermissionContext["userRole"]
  ): PeopleService {
    return new PeopleService(drizzleClient, {
      userId,
      tenantId,
      userRole,
    });
  }
}
