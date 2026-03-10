import { eq, and, inArray } from "drizzle-orm";
import {
  people,
  peopleCompanies,
  comms,
  commsPeople,
  companies,
  companyDomains,
  companyWebsites,
} from "@db/ledger/schema";
import { workspacePersonProfiles } from "@db/packages/schema";
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
  WorkspacePersonProfile,
  ActivityDTO,
} from "@/spaces/packages/workspace/types";

type PersonUpdate = Partial<
  Omit<Person, "id" | "tenantId" | "createdAt" | "updatedAt">
>;

export type PersonDetailResult = Person & {
  title: string | null;
  companies: CompanyWithWeb[];
  companyRoles: { companyId: string; role: string | null; isPrimary: boolean | null }[];
  comms: Comm[];
  projection: WorkspacePersonProfile | null;
  recentActivities: ActivityDTO[];
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

export class PeopleService extends WorkspaceService {
  constructor(drizzleClient: DrizzleClient, permissionContext: PermissionContext) {
    super(drizzleClient, permissionContext);
  }

  async canRead(personId?: string): Promise<boolean> {
    return !!this.permissionContext.tenantId!;
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
    if (!this.permissionContext.tenantId!) {
      throw new Error("Tenant ID is required to fetch people");
    }

    if (!(await this.canRead())) {
      throw new Error("Insufficient permissions to read people");
    }

    const _scope = this.getScope();

    return await this.db
      .select()
      .from(people)
      .where(eq(people.tenantId, this.permissionContext.tenantId!));
  }

  async getPersonById(
    id: string
  ): Promise<PersonDetailResult | null> {
    if (!this.permissionContext.tenantId!) {
      throw new Error("Tenant ID is required to fetch a person");
    }

    if (!(await this.canRead(id))) {
      throw new Error("Insufficient permissions to read this person");
    }

    const _scope = this.getScope();
    const tenantId = this.permissionContext.tenantId!;

    const [person] = await this.db
      .select()
      .from(people)
      .where(and(eq(people.id, id), eq(people.tenantId, tenantId)));

    if (!person) return null;

    const personCompaniesList = await this.db
      .select({
        company: companies,
        role: peopleCompanies.role,
        isPrimary: peopleCompanies.isPrimary,
      })
      .from(peopleCompanies)
      .innerJoin(companies, eq(peopleCompanies.companyId, companies.id))
      .where(
        and(
          eq(peopleCompanies.tenantId, tenantId),
          eq(peopleCompanies.personId, id),
        ),
      );

    const linkedCompanies = personCompaniesList.map((pc) => pc.company);
    const companyIds = linkedCompanies.map((c) => c.id);
    const companyRoles = personCompaniesList.map((pc) => ({
      companyId: pc.company.id,
      role: pc.role,
      isPrimary: pc.isPrimary,
    }));

    const primaryLink = companyRoles.find((r) => r.isPrimary) ?? companyRoles[0];

    const [domainRows, websiteRows] =
      companyIds.length > 0
        ? await Promise.all([
            this.db
              .select()
              .from(companyDomains)
              .where(
                and(
                  eq(companyDomains.tenantId, tenantId),
                  inArray(companyDomains.companyId, companyIds),
                ),
              ),
            this.db
              .select()
              .from(companyWebsites)
              .where(
                and(
                  eq(companyWebsites.tenantId, tenantId),
                  inArray(companyWebsites.companyId, companyIds),
                ),
              ),
          ])
        : [[], []];

    const domainsByCompany = new Map<string, CompanyDomain[]>();
    for (const d of domainRows as CompanyDomain[]) {
      const arr = domainsByCompany.get(d.companyId) ?? [];
      arr.push(d);
      domainsByCompany.set(d.companyId, arr);
    }

    const websitesByCompany = new Map<string, CompanyWebsite[]>();
    for (const w of websiteRows as CompanyWebsite[]) {
      const arr = websitesByCompany.get(w.companyId) ?? [];
      arr.push(w);
      websitesByCompany.set(w.companyId, arr);
    }

    const personCommsList = await this.db
      .select({ comm: comms })
      .from(commsPeople)
      .innerJoin(comms, eq(commsPeople.commId, comms.id))
      .where(
        and(eq(commsPeople.tenantId, tenantId), eq(commsPeople.personId, id)),
      );

    const [profile] = await this.db
      .select()
      .from(workspacePersonProfiles)
      .where(
        and(
          eq(workspacePersonProfiles.tenantId, tenantId),
          eq(workspacePersonProfiles.personId, id),
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
      personId: id,
      limit: 10,
    });

    return {
      ...person,
      title: primaryLink?.role ?? null,
      companies: linkedCompanies.map((c) => ({
        ...c,
        domains: domainsByCompany.get(c.id) ?? [],
        websites: websitesByCompany.get(c.id) ?? [],
      })),
      companyRoles,
      comms: personCommsList.map((pc) => pc.comm),
      projection: profile ?? null,
      recentActivities: recentActivities.activities,
    };
  }

  async createPerson(
    data: Omit<NewPerson, "id" | "tenantId" | "createdAt" | "updatedAt">
  ): Promise<Person> {
    if (!this.permissionContext.tenantId!) {
      throw new Error("Tenant ID is required to create a person");
    }
    if (!(await this.canCreate())) {
      throw new Error("Insufficient permissions to create a person");
    }
    return this.ledger.insertPerson(this.permissionContext.tenantId!, data);
  }

  async updatePerson(id: string, updates: PersonUpdate): Promise<Person> {
    if (!this.permissionContext.tenantId!) {
      throw new Error("Tenant ID is required to update a person");
    }
    if (!(await this.canUpdate(id))) {
      throw new Error("Insufficient permissions to update this person");
    }
    return this.ledger.updatePerson(this.permissionContext.tenantId!, id, updates);
  }

  async deletePerson(id: string): Promise<void> {
    if (!this.permissionContext.tenantId!) {
      throw new Error("Tenant ID is required to delete a person");
    }
    if (!(await this.canDelete(id))) {
      throw new Error("Insufficient permissions to delete this person");
    }
    await this.ledger.deletePerson(this.permissionContext.tenantId!, id);
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

  async removeCompanyLink(personId: string, companyId: string): Promise<void> {
    if (!this.permissionContext.tenantId!)
      throw new Error("Tenant ID is required");
    await this.ledger.unlinkPersonCompany(
      this.permissionContext.tenantId!,
      personId,
      companyId,
    );
  }

  async createAndLinkCompany(
    personId: string,
    data: CompanyCreateInput,
    role?: string,
    isPrimary?: boolean
  ): Promise<Company> {
    if (!this.permissionContext.tenantId!)
      throw new Error("Tenant ID is required");

    const normalizedDomains = normalizeDomainEntries(data.domains);
    const normalizedWebsites = normalizeWebsiteEntries(data.websites);
    const { domains: _domains, websites: _websites, ...companyData } = data;

    const result = await this.ledger.insertCompany(
      this.permissionContext.tenantId!,
      companyData,
      normalizedDomains,
      normalizedWebsites,
    );

    await this.addCompanyLink(personId, result.id, role, isPrimary);
    return result;
  }

  /* =========================
     ASSOCIATIONS (COMMS)
  ========================= */

  async addCommLink(personId: string, commId: string): Promise<void> {
    if (!this.permissionContext.tenantId!)
      throw new Error("Tenant ID is required");
    await this.ledger.linkCommPerson(
      this.permissionContext.tenantId!,
      commId,
      personId,
    );
  }

  async removeCommLink(personId: string, commId: string): Promise<void> {
    if (!this.permissionContext.tenantId!)
      throw new Error("Tenant ID is required");
    await this.ledger.unlinkCommPerson(
      this.permissionContext.tenantId!,
      commId,
      personId,
    );
  }

  async createAndLinkComm(
    personId: string,
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

    await this.ledger.linkCommPerson(
      this.permissionContext.tenantId!,
      comm.id,
      personId,
    );

    return comm;
  }

  async updateProjection(
    personId: string,
    data: {
      ownerMemberProfileId?: string | null;
      ownerOrgUnitId?: string | null;
      status?: string | null;
      isVip?: boolean;
    },
  ): Promise<WorkspacePersonProfile> {
    const tenantId = this.permissionContext.tenantId!;
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!(await this.canUpdate(personId)))
      throw new Error("Insufficient permissions");

    const [existing] = await this.db
      .select()
      .from(workspacePersonProfiles)
      .where(
        and(
          eq(workspacePersonProfiles.tenantId, tenantId),
          eq(workspacePersonProfiles.personId, personId),
        ),
      );

    if (existing) {
      const [updated] = await this.db
        .update(workspacePersonProfiles)
        .set(data)
        .where(eq(workspacePersonProfiles.id, existing.id))
        .returning();
      return updated!;
    }

    const [created] = await this.db
      .insert(workspacePersonProfiles)
      .values({ tenantId, personId, ...data, isVip: data.isVip ?? false })
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
  ): PeopleService {
    return new PeopleService(drizzleClient, {
      userId,
      tenantId,
      userRole,
      memberProfileId: memberProfileId ?? undefined,
      orgUnitIds,
      orgUnitPaths,
    });
  }
}
