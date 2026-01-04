import { eq, and } from "drizzle-orm";
import type { db } from "@/spaces/platform/server/db";
import {
  companies,
  peopleCompanies,
  comms,
  commsCompanies,
  people,
} from "@db/product/schema";
import {
  BaseEntityService,
  type PermissionContext,
} from "@/spaces/platform/server/base-entity.service";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { normalizeComm, type CommType } from "@db/product/comm-validation";

type Company = InferSelectModel<typeof companies>;
type NewCompany = InferInsertModel<typeof companies>;
type CompanyUpdate = Partial<
  Omit<Company, "id" | "tenantId" | "createdAt" | "updatedAt">
>;

type Person = InferSelectModel<typeof people>;
type NewPerson = InferInsertModel<typeof people>;
type Comm = InferSelectModel<typeof comms>;
type NewComm = InferInsertModel<typeof comms>;

export class CompaniesService extends BaseEntityService {
  constructor(drizzleClient: typeof db, permissionContext: PermissionContext) {
    super(drizzleClient, permissionContext);
  }

  async canRead(companyId?: string): Promise<boolean> {
    return !!this.permissionContext.tenantId;
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

  async getCompanies(): Promise<Company[]> {
    if (!this.permissionContext.tenantId) {
      throw new Error("Tenant ID is required to fetch companies");
    }

    if (!(await this.canRead())) {
      throw new Error("Insufficient permissions to read companies");
    }

    return await this.db
      .select()
      .from(companies)
      .where(eq(companies.tenantId, this.permissionContext.tenantId));
  }

  async getCompanyById(
    id: string
  ): Promise<(Company & { people: Person[]; comms: Comm[] }) | null> {
    if (!this.permissionContext.tenantId) {
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
          eq(companies.tenantId, this.permissionContext.tenantId)
        )
      );

    if (!company) return null;

    const companyPeopleList = await this.db
      .select({
        person: people,
      })
      .from(peopleCompanies)
      .innerJoin(people, eq(peopleCompanies.personId, people.id))
      .where(
        and(
          eq(peopleCompanies.tenantId, this.permissionContext.tenantId),
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
          eq(commsCompanies.tenantId, this.permissionContext.tenantId),
          eq(commsCompanies.companyId, id)
        )
      );

    return {
      ...company,
      people: companyPeopleList.map((cp) => cp.person),
      comms: companyCommsList.map((cc) => cc.comm),
    };
  }

  async createCompany(
    data: Omit<NewCompany, "id" | "tenantId" | "createdAt" | "updatedAt">
  ): Promise<Company> {
    if (!this.permissionContext.tenantId) {
      throw new Error("Tenant ID is required to create a company");
    }

    if (!(await this.canCreate())) {
      throw new Error("Insufficient permissions to create a company");
    }

    const [company] = await this.db
      .insert(companies)
      .values({
        ...data,
        tenantId: this.permissionContext.tenantId,
      })
      .returning();

    if (!company) throw new Error("Failed to create company");

    return company;
  }

  async updateCompany(id: string, updates: CompanyUpdate): Promise<Company> {
    if (!this.permissionContext.tenantId) {
      throw new Error("Tenant ID is required to update a company");
    }

    if (!(await this.canUpdate(id))) {
      throw new Error("Insufficient permissions to update this company");
    }

    const [updated] = await this.db
      .update(companies)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(companies.id, id),
          eq(companies.tenantId, this.permissionContext.tenantId)
        )
      )
      .returning();

    if (!updated) throw new Error("Company not found or update failed");

    return updated;
  }

  async deleteCompany(id: string): Promise<void> {
    if (!this.permissionContext.tenantId) {
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
          eq(companies.tenantId, this.permissionContext.tenantId)
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
    if (!this.permissionContext.tenantId)
      throw new Error("Tenant ID is required");

    await this.db.insert(peopleCompanies).values({
      tenantId: this.permissionContext.tenantId,
      companyId,
      personId,
      role,
      isPrimary: isPrimary ?? false,
    });
  }

  async removePersonLink(companyId: string, personId: string): Promise<void> {
    if (!this.permissionContext.tenantId)
      throw new Error("Tenant ID is required");

    await this.db
      .delete(peopleCompanies)
      .where(
        and(
          eq(peopleCompanies.tenantId, this.permissionContext.tenantId),
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
    if (!this.permissionContext.tenantId)
      throw new Error("Tenant ID is required");

    const [person] = await this.db
      .insert(people)
      .values({
        ...data,
        tenantId: this.permissionContext.tenantId,
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
    if (!this.permissionContext.tenantId)
      throw new Error("Tenant ID is required");

    await this.db.insert(commsCompanies).values({
      tenantId: this.permissionContext.tenantId,
      companyId,
      commId,
    });
  }

  async removeCommLink(companyId: string, commId: string): Promise<void> {
    if (!this.permissionContext.tenantId)
      throw new Error("Tenant ID is required");

    await this.db
      .delete(commsCompanies)
      .where(
        and(
          eq(commsCompanies.tenantId, this.permissionContext.tenantId),
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
    if (!this.permissionContext.tenantId)
      throw new Error("Tenant ID is required");

    const { value, canonicalValue } = normalizeComm(
      data.type as CommType,
      data.value
    );

    // Try to find existing comm first
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
      .from(commsCompanies)
      .where(
        and(
          eq(commsCompanies.tenantId, this.permissionContext.tenantId),
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
