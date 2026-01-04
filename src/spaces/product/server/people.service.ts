import { eq, and } from "drizzle-orm";
import { db } from "@/spaces/platform/server/db";
import { people, peopleCompanies, comms, commsPeople, companies } from "@db/product/schema";
import { BaseEntityService, PermissionContext } from "@/spaces/platform/server/base-entity.service";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

type Person = InferSelectModel<typeof people>;
type NewPerson = InferInsertModel<typeof people>;
type PersonUpdate = Partial<Omit<Person, "id" | "tenantId" | "createdAt" | "updatedAt">>;

type Company = InferSelectModel<typeof companies>;
type NewCompany = InferInsertModel<typeof companies>;
type Comm = InferSelectModel<typeof comms>;
type NewComm = InferInsertModel<typeof comms>;

export class PeopleService extends BaseEntityService {
  constructor(
    drizzleClient: typeof db,
    permissionContext: PermissionContext
  ) {
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

  async getPersonById(id: string): Promise<(Person & { companies: Company[], comms: Comm[] }) | null> {
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
      companies: personCompaniesList.map((pc) => pc.company),
      comms: personCommsList.map((pc) => pc.comm),
    };
  }

  async createPerson(data: Omit<NewPerson, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Person> {
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
    if (!this.permissionContext.tenantId) throw new Error("Tenant ID is required");

    await this.db.insert(peopleCompanies).values({
      tenantId: this.permissionContext.tenantId,
      personId,
      companyId,
      role,
      isPrimary: isPrimary ?? false,
    });
  }

  async removeCompanyLink(personId: string, companyId: string): Promise<void> {
    if (!this.permissionContext.tenantId) throw new Error("Tenant ID is required");

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
    data: Omit<NewCompany, "id" | "tenantId" | "createdAt" | "updatedAt">,
    role?: string,
    isPrimary?: boolean
  ): Promise<Company> {
    if (!this.permissionContext.tenantId) throw new Error("Tenant ID is required");

    const [company] = await this.db
      .insert(companies)
      .values({
        ...data,
        tenantId: this.permissionContext.tenantId,
      })
      .returning();

    if (!company) throw new Error("Failed to create company");

    await this.addCompanyLink(personId, company.id, role, isPrimary);

    return company;
  }

  /* =========================
     ASSOCIATIONS (COMMS)
  ========================= */

  async addCommLink(personId: string, commId: string): Promise<void> {
    if (!this.permissionContext.tenantId) throw new Error("Tenant ID is required");

    await this.db.insert(commsPeople).values({
      tenantId: this.permissionContext.tenantId,
      personId,
      commId,
    });
  }

  async removeCommLink(personId: string, commId: string): Promise<void> {
    if (!this.permissionContext.tenantId) throw new Error("Tenant ID is required");

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
    data: Omit<NewComm, "id" | "tenantId" | "createdAt" | "updatedAt">
  ): Promise<Comm> {
    if (!this.permissionContext.tenantId) throw new Error("Tenant ID is required");

    const [comm] = await this.db
      .insert(comms)
      .values({
        ...data,
        tenantId: this.permissionContext.tenantId,
      })
      .returning();

    if (!comm) throw new Error("Failed to create comm");

    await this.addCommLink(personId, comm.id);

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

