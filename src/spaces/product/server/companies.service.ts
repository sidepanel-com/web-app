import { eq, and, inArray } from "drizzle-orm";
import type { db } from "@/spaces/platform/server/db";
import {
  companies,
  peopleCompanies,
  comms,
  commsCompanies,
  people,
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

type Company = InferSelectModel<typeof companies>;
type NewCompany = InferInsertModel<typeof companies>;
type CompanyUpdate = Partial<
  Omit<Company, "id" | "tenantId" | "createdAt" | "updatedAt">
>;

type Person = InferSelectModel<typeof people>;
type NewPerson = InferInsertModel<typeof people>;
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

type CompanyUpdateInput = CompanyUpdate & {
  domains?: Array<{ domain: string; isPrimary?: boolean }>;
  websites?: Array<{ url: string; type?: string; isPrimary?: boolean }>;
};

function normalizeDomainEntries(
  input: CompanyCreateInput["domains"] | CompanyUpdateInput["domains"]
) {
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

  // Ensure exactly one primary (if any values exist).
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

function normalizeWebsiteEntries(
  input: CompanyCreateInput["websites"] | CompanyUpdateInput["websites"]
) {
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

  // Ensure exactly one primary (if any values exist).
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

export class CompaniesService extends BaseEntityService {
  constructor(drizzleClient: typeof db, permissionContext: PermissionContext) {
    super(drizzleClient, permissionContext);
  }

  async canRead(companyId?: string): Promise<boolean> {
    return !!this.permissionContext.tenantId!;
  }

  async canCreate(): Promise<boolean> {
    return await this.hasPermission("create");
  }

  async canUpdate(companyId: string): Promise<boolean> {
    return await this.hasPermission("update");
  }

  async canDelete(companyId: string): Promise<boolean> {
    return await this.hasPermission("delete");
  }

  async getCompanies(): Promise<CompanyWithWeb[]> {
    if (!this.permissionContext.tenantId!) {
      throw new Error("Tenant ID is required to fetch companies");
    }

    if (!(await this.canRead())) {
      throw new Error("Insufficient permissions to read companies");
    }

    const baseCompanies = await this.db
      .select()
      .from(companies)
      .where(eq(companies.tenantId, this.permissionContext.tenantId!));

    const companyIds = baseCompanies.map((c) => c.id);
    if (companyIds.length === 0) return [];

    const [domains, websites] = await Promise.all([
      this.db
        .select()
        .from(companyDomains)
        .where(
          and(
            eq(companyDomains.tenantId, this.permissionContext.tenantId!),
            inArray(companyDomains.companyId, companyIds)
          )
        ),
      this.db
        .select()
        .from(companyWebsites)
        .where(
          and(
            eq(companyWebsites.tenantId, this.permissionContext.tenantId!),
            inArray(companyWebsites.companyId, companyIds)
          )
        ),
    ]);

    const domainsByCompany = new Map<string, CompanyDomain[]>();
    for (const d of domains) {
      const arr = domainsByCompany.get(d.companyId) ?? [];
      arr.push(d);
      domainsByCompany.set(d.companyId, arr);
    }

    const websitesByCompany = new Map<string, CompanyWebsite[]>();
    for (const w of websites) {
      const arr = websitesByCompany.get(w.companyId) ?? [];
      arr.push(w);
      websitesByCompany.set(w.companyId, arr);
    }

    return baseCompanies.map((c) => ({
      ...c,
      domains: domainsByCompany.get(c.id) ?? [],
      websites: websitesByCompany.get(c.id) ?? [],
    }));
  }

  async getCompanyById(
    id: string
  ): Promise<(CompanyWithWeb & { people: Person[]; comms: Comm[] }) | null> {
    if (!this.permissionContext.tenantId!) {
      throw new Error("Tenant ID is required to fetch a company");
    }

    if (!(await this.canRead(id))) {
      throw new Error("Insufficient permissions to read this company");
    }

    const [company] = await this.db
      .select()
      .from(companies)
      .where(
        and(
          eq(companies.id, id),
          eq(companies.tenantId, this.permissionContext.tenantId!)
        )
      );

    if (!company) return null;

    const [domains, websites] = await Promise.all([
      this.db
        .select()
        .from(companyDomains)
        .where(
          and(
            eq(companyDomains.tenantId, this.permissionContext.tenantId!),
            eq(companyDomains.companyId, id)
          )
        ),
      this.db
        .select()
        .from(companyWebsites)
        .where(
          and(
            eq(companyWebsites.tenantId, this.permissionContext.tenantId!),
            eq(companyWebsites.companyId, id)
          )
        ),
    ]);

    const companyPeopleList = await this.db
      .select({
        person: people,
      })
      .from(peopleCompanies)
      .innerJoin(people, eq(peopleCompanies.personId, people.id))
      .where(
        and(
          eq(peopleCompanies.tenantId, this.permissionContext.tenantId!),
          eq(peopleCompanies.companyId, id)
        )
      );

    const companyCommsList = await this.db
      .select({
        comm: comms,
      })
      .from(commsCompanies)
      .innerJoin(comms, eq(commsCompanies.commId, comms.id))
      .where(
        and(
          eq(commsCompanies.tenantId, this.permissionContext.tenantId!),
          eq(commsCompanies.companyId, id)
        )
      );

    return {
      ...company,
      domains,
      websites,
      people: companyPeopleList.map((cp) => cp.person),
      comms: companyCommsList.map((cc) => cc.comm),
    };
  }

  async createCompany(data: CompanyCreateInput): Promise<CompanyWithWeb> {
    if (!this.permissionContext.tenantId!) {
      throw new Error("Tenant ID is required to create a company");
    }

    if (!(await this.canCreate())) {
      throw new Error("Insufficient permissions to create a company");
    }

    const normalizedDomains = normalizeDomainEntries(data.domains);
    const normalizedWebsites = normalizeWebsiteEntries(data.websites);

    const { domains: _domains, websites: _websites, ...companyData } = data;

    return await this.db.transaction(async (tx) => {
      const [company] = await tx
        .insert(companies)
        .values({
          ...companyData,
          tenantId: this.permissionContext.tenantId!!,
        })
        .returning();

      if (!company) throw new Error("Failed to create company");

      let createdDomains: CompanyDomain[] = [];
      let createdWebsites: CompanyWebsite[] = [];

      if (normalizedDomains.length > 0) {
        createdDomains = await tx
          .insert(companyDomains)
          .values(
            normalizedDomains.map((d) => ({
              tenantId: this.permissionContext.tenantId!!,
              companyId: company.id,
              domain: d.domain,
              isPrimary: d.isPrimary,
            }))
          )
          .returning();
      }

      if (normalizedWebsites.length > 0) {
        createdWebsites = await tx
          .insert(companyWebsites)
          .values(
            normalizedWebsites.map((w) => ({
              tenantId: this.permissionContext.tenantId!!,
              companyId: company.id,
              url: w.url,
              type: w.type,
              isPrimary: w.isPrimary,
            }))
          )
          .returning();
      }

      return { ...company, domains: createdDomains, websites: createdWebsites };
    });
  }

  async updateCompany(
    id: string,
    updates: CompanyUpdateInput
  ): Promise<CompanyWithWeb> {
    if (!this.permissionContext.tenantId!) {
      throw new Error("Tenant ID is required to update a company");
    }

    if (!(await this.canUpdate(id))) {
      throw new Error("Insufficient permissions to update this company");
    }

    const normalizedDomains =
      updates.domains !== undefined
        ? normalizeDomainEntries(updates.domains)
        : undefined;
    const normalizedWebsites =
      updates.websites !== undefined
        ? normalizeWebsiteEntries(updates.websites)
        : undefined;

    const {
      domains: _domains,
      websites: _websites,
      ...companyUpdates
    } = updates;

    return await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(companies)
        .set({
          ...companyUpdates,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(companies.id, id),
            eq(companies.tenantId, this.permissionContext.tenantId!)
          )
        )
        .returning();

      if (!updated) throw new Error("Company not found or update failed");

      let finalDomains: CompanyDomain[];
      let finalWebsites: CompanyWebsite[];

      if (normalizedDomains !== undefined) {
        await tx
          .delete(companyDomains)
          .where(
            and(
              eq(companyDomains.tenantId, this.permissionContext.tenantId!),
              eq(companyDomains.companyId, id)
            )
          );
        finalDomains =
          normalizedDomains.length > 0
            ? await tx
                .insert(companyDomains)
                .values(
                  normalizedDomains.map((d) => ({
                    tenantId: this.permissionContext.tenantId!!,
                    companyId: id,
                    domain: d.domain,
                    isPrimary: d.isPrimary,
                  }))
                )
                .returning()
            : [];
      } else {
        finalDomains = await tx
          .select()
          .from(companyDomains)
          .where(
            and(
              eq(companyDomains.tenantId, this.permissionContext.tenantId!),
              eq(companyDomains.companyId, id)
            )
          );
      }

      if (normalizedWebsites !== undefined) {
        await tx
          .delete(companyWebsites)
          .where(
            and(
              eq(companyWebsites.tenantId, this.permissionContext.tenantId!),
              eq(companyWebsites.companyId, id)
            )
          );
        finalWebsites =
          normalizedWebsites.length > 0
            ? await tx
                .insert(companyWebsites)
                .values(
                  normalizedWebsites.map((w) => ({
                    tenantId: this.permissionContext.tenantId!!,
                    companyId: id,
                    url: w.url,
                    type: w.type,
                    isPrimary: w.isPrimary,
                  }))
                )
                .returning()
            : [];
      } else {
        finalWebsites = await tx
          .select()
          .from(companyWebsites)
          .where(
            and(
              eq(companyWebsites.tenantId, this.permissionContext.tenantId!),
              eq(companyWebsites.companyId, id)
            )
          );
      }

      return { ...updated, domains: finalDomains, websites: finalWebsites };
    });
  }

  async deleteCompany(id: string): Promise<void> {
    if (!this.permissionContext.tenantId!) {
      throw new Error("Tenant ID is required to delete a company");
    }

    if (!(await this.canDelete(id))) {
      throw new Error("Insufficient permissions to delete this company");
    }

    await this.db
      .delete(companies)
      .where(
        and(
          eq(companies.id, id),
          eq(companies.tenantId, this.permissionContext.tenantId!)
        )
      );
  }

  /* =========================
     ASSOCIATIONS (PEOPLE)
  ========================= */

  async addPersonLink(
    companyId: string,
    personId: string,
    role?: string,
    isPrimary?: boolean
  ): Promise<void> {
    if (!this.permissionContext.tenantId!)
      throw new Error("Tenant ID is required");

    await this.db.insert(peopleCompanies).values({
      tenantId: this.permissionContext.tenantId!!,
      companyId,
      personId,
      role,
      isPrimary: isPrimary ?? false,
    });
  }

  async removePersonLink(companyId: string, personId: string): Promise<void> {
    if (!this.permissionContext.tenantId!)
      throw new Error("Tenant ID is required");

    await this.db
      .delete(peopleCompanies)
      .where(
        and(
          eq(peopleCompanies.tenantId, this.permissionContext.tenantId!),
          eq(peopleCompanies.companyId, companyId),
          eq(peopleCompanies.personId, personId)
        )
      );
  }

  async createAndLinkPerson(
    companyId: string,
    data: Omit<NewPerson, "id" | "tenantId" | "createdAt" | "updatedAt">,
    role?: string,
    isPrimary?: boolean
  ): Promise<Person> {
    if (!this.permissionContext.tenantId!)
      throw new Error("Tenant ID is required");

    const [person] = await this.db
      .insert(people)
      .values({
        ...data,
        tenantId: this.permissionContext.tenantId!!,
      })
      .returning();

    if (!person) throw new Error("Failed to create person");

    await this.addPersonLink(companyId, person.id, role, isPrimary);

    return person;
  }

  /* =========================
     ASSOCIATIONS (COMMS)
  ========================= */

  async addCommLink(companyId: string, commId: string): Promise<void> {
    if (!this.permissionContext.tenantId!)
      throw new Error("Tenant ID is required");

    // Check if link already exists
    const [existingLink] = await this.db
      .select()
      .from(commsCompanies)
      .where(
        and(
          eq(commsCompanies.tenantId, this.permissionContext.tenantId!),
          eq(commsCompanies.companyId, companyId),
          eq(commsCompanies.commId, commId)
        )
      )
      .limit(1);

    if (!existingLink) {
      await this.db.insert(commsCompanies).values({
        tenantId: this.permissionContext.tenantId!!,
        companyId,
        commId,
      });
    }
  }

  async removeCommLink(companyId: string, commId: string): Promise<void> {
    if (!this.permissionContext.tenantId!)
      throw new Error("Tenant ID is required");

    await this.db
      .delete(commsCompanies)
      .where(
        and(
          eq(commsCompanies.tenantId, this.permissionContext.tenantId!),
          eq(commsCompanies.companyId, companyId),
          eq(commsCompanies.commId, commId)
        )
      );
  }

  async createAndLinkComm(
    companyId: string,
    data: Omit<
      NewComm,
      "id" | "tenantId" | "createdAt" | "updatedAt" | "canonicalValue"
    >
  ): Promise<Comm> {
    if (!this.permissionContext.tenantId!)
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
          eq(comms.tenantId, this.permissionContext.tenantId!),
          eq(comms.type, data.type),
          eq(comms.canonicalValue, canonicalValue)
        )
      )
      .limit(1);

    if (!comm) {
      [comm] = await this.db
        .insert(comms)
        .values({
          tenantId: this.permissionContext.tenantId!!,
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
      .from(commsCompanies)
      .where(
        and(
          eq(commsCompanies.tenantId, this.permissionContext.tenantId!),
          eq(commsCompanies.companyId, companyId),
          eq(commsCompanies.commId, comm.id)
        )
      )
      .limit(1);

    if (!existingLink) {
      await this.addCommLink(companyId, comm.id);
    }

    return comm;
  }

  static create(
    drizzleClient: typeof db,
    userId: string,
    tenantId: string,
    userRole?: PermissionContext["userRole"]
  ): CompaniesService {
    return new CompaniesService(drizzleClient, {
      userId,
      tenantId,
      userRole,
    });
  }
}
