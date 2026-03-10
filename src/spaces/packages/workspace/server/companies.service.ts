import { eq, and, inArray } from "drizzle-orm";
import {
  companies,
  peopleCompanies,
  comms,
  commsCompanies,
  people,
  companyDomains,
  companyWebsites,
} from "@db/ledger/schema";
import { workspaceCompanyProfiles } from "@db/packages/schema";
import {
  normalizeComm,
  type CommType,
} from "@/spaces/packages/workspace/lib/comm-validation";
import {
  normalizeDomain,
  isValidDomain,
  tryNormalizeWebsiteUrl,
} from "@/spaces/packages/workspace/lib/company-validation";
import { WorkspaceService } from "@/spaces/packages/workspace/server/workspace-service";
import { ActivitiesService } from "@/spaces/packages/workspace/server/activities.service";
import type {
  PermissionContext,
  DrizzleClient,
  Person,
  NewPerson,
  Company,
  NewCompany,
  Comm,
  NewComm,
  CompanyDomain,
  CompanyWebsite,
  CompanyWithWeb,
  WorkspaceCompanyProfile,
  ActivityDTO,
} from "@/spaces/packages/workspace/types";

type CompanyUpdate = Partial<
  Omit<Company, "id" | "tenantId" | "createdAt" | "updatedAt">
>;

export type CompanyDetailResult = CompanyWithWeb & {
  people: (Person & { role: string | null })[];
  comms: Comm[];
  contactCount: number;
  projection: WorkspaceCompanyProfile | null;
  recentActivities: ActivityDTO[];
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

export class CompaniesService extends WorkspaceService {
  constructor(drizzleClient: DrizzleClient, permissionContext: PermissionContext) {
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

    const _scope = this.getScope();

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
  ): Promise<CompanyDetailResult | null> {
    const tenantId = this.permissionContext.tenantId!;
    if (!tenantId) {
      throw new Error("Tenant ID is required to fetch a company");
    }

    if (!(await this.canRead(id))) {
      throw new Error("Insufficient permissions to read this company");
    }

    const _scope = this.getScope();

    const [company] = await this.db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.tenantId, tenantId)));

    if (!company) return null;

    const [domainRows, websiteRows] = await Promise.all([
      this.db
        .select()
        .from(companyDomains)
        .where(
          and(
            eq(companyDomains.tenantId, tenantId),
            eq(companyDomains.companyId, id),
          ),
        ),
      this.db
        .select()
        .from(companyWebsites)
        .where(
          and(
            eq(companyWebsites.tenantId, tenantId),
            eq(companyWebsites.companyId, id),
          ),
        ),
    ]);

    const companyPeopleList = await this.db
      .select({
        person: people,
        role: peopleCompanies.role,
      })
      .from(peopleCompanies)
      .innerJoin(people, eq(peopleCompanies.personId, people.id))
      .where(
        and(
          eq(peopleCompanies.tenantId, tenantId),
          eq(peopleCompanies.companyId, id),
        ),
      );

    const companyCommsList = await this.db
      .select({ comm: comms })
      .from(commsCompanies)
      .innerJoin(comms, eq(commsCompanies.commId, comms.id))
      .where(
        and(
          eq(commsCompanies.tenantId, tenantId),
          eq(commsCompanies.companyId, id),
        ),
      );

    const [profile] = await this.db
      .select()
      .from(workspaceCompanyProfiles)
      .where(
        and(
          eq(workspaceCompanyProfiles.tenantId, tenantId),
          eq(workspaceCompanyProfiles.companyId, id),
        ),
      );

    const activitiesService = ActivitiesService.create(
      this.db,
      this.permissionContext.userId,
      tenantId,
      this.permissionContext.userRole,
      this.permissionContext.memberProfileId ?? null,
      this.permissionContext.orgUnitIds,
      this.permissionContext.orgUnitPaths,
    );

    const recentActivities = await activitiesService.getActivities({
      companyId: id,
      limit: 10,
    });

    return {
      ...company,
      domains: domainRows,
      websites: websiteRows,
      people: companyPeopleList.map((cp) => ({
        ...cp.person,
        role: cp.role,
      })),
      comms: companyCommsList.map((cc) => cc.comm),
      contactCount: companyPeopleList.length,
      projection: profile ?? null,
      recentActivities: recentActivities.activities,
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

    return this.ledger.insertCompany(
      this.permissionContext.tenantId!,
      companyData,
      normalizedDomains,
      normalizedWebsites,
    );
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

    return this.ledger.updateCompany(
      this.permissionContext.tenantId!,
      id,
      companyUpdates,
      normalizedDomains,
      normalizedWebsites,
    );
  }

  async deleteCompany(id: string): Promise<void> {
    if (!this.permissionContext.tenantId!) {
      throw new Error("Tenant ID is required to delete a company");
    }
    if (!(await this.canDelete(id))) {
      throw new Error("Insufficient permissions to delete this company");
    }
    await this.ledger.deleteCompany(this.permissionContext.tenantId!, id);
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
    await this.ledger.linkPersonCompany(
      this.permissionContext.tenantId!,
      personId,
      companyId,
      role,
      isPrimary,
    );
  }

  async removePersonLink(companyId: string, personId: string): Promise<void> {
    if (!this.permissionContext.tenantId!)
      throw new Error("Tenant ID is required");
    await this.ledger.unlinkPersonCompany(
      this.permissionContext.tenantId!,
      personId,
      companyId,
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

    const person = await this.ledger.insertPerson(
      this.permissionContext.tenantId!,
      data,
    );
    await this.addPersonLink(companyId, person.id, role, isPrimary);
    return person;
  }

  /* =========================
     ASSOCIATIONS (COMMS)
  ========================= */

  async addCommLink(companyId: string, commId: string): Promise<void> {
    if (!this.permissionContext.tenantId!)
      throw new Error("Tenant ID is required");
    await this.ledger.linkCommCompany(
      this.permissionContext.tenantId!,
      commId,
      companyId,
    );
  }

  async removeCommLink(companyId: string, commId: string): Promise<void> {
    if (!this.permissionContext.tenantId!)
      throw new Error("Tenant ID is required");
    await this.ledger.unlinkCommCompany(
      this.permissionContext.tenantId!,
      commId,
      companyId,
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

    const { value, canonicalValue } = normalizeComm(
      data.type as CommType,
      data.value
    );

    const comm = await this.ledger.findOrCreateComm(
      this.permissionContext.tenantId!,
      data.type,
      value,
      canonicalValue,
    );

    await this.ledger.linkCommCompany(
      this.permissionContext.tenantId!,
      comm.id,
      companyId,
    );

    return comm;
  }

  async updateProjection(
    companyId: string,
    data: {
      ownerMemberProfileId?: string | null;
      ownerOrgUnitId?: string | null;
      status?: string | null;
    },
  ): Promise<WorkspaceCompanyProfile> {
    const tenantId = this.permissionContext.tenantId!;
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!(await this.canUpdate(companyId)))
      throw new Error("Insufficient permissions");

    const [existing] = await this.db
      .select()
      .from(workspaceCompanyProfiles)
      .where(
        and(
          eq(workspaceCompanyProfiles.tenantId, tenantId),
          eq(workspaceCompanyProfiles.companyId, companyId),
        ),
      );

    if (existing) {
      const [updated] = await this.db
        .update(workspaceCompanyProfiles)
        .set(data)
        .where(eq(workspaceCompanyProfiles.id, existing.id))
        .returning();
      return updated!;
    }

    const [created] = await this.db
      .insert(workspaceCompanyProfiles)
      .values({ tenantId, companyId, ...data })
      .returning();
    return created!;
  }

  static create(
    drizzleClient: DrizzleClient,
    userId: string,
    tenantId: string,
    userRole?: PermissionContext["userRole"],
    memberProfileId?: string | null,
    orgUnitIds?: string[],
    orgUnitPaths?: string[],
  ): CompaniesService {
    return new CompaniesService(drizzleClient, {
      userId,
      tenantId,
      userRole,
      memberProfileId: memberProfileId ?? undefined,
      orgUnitIds,
      orgUnitPaths,
    });
  }
}
