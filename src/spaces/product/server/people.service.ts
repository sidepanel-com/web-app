import { eq, and } from "drizzle-orm";
import { db } from "@/spaces/platform/server/db";
import { people } from "@db/product/schema";
import { BaseEntityService, PermissionContext } from "@/spaces/platform/server/base-entity.service";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

type Person = InferSelectModel<typeof people>;
type NewPerson = InferInsertModel<typeof people>;
type PersonUpdate = Partial<Omit<Person, "id" | "tenantId" | "createdAt" | "updatedAt">>;

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

  async getPersonById(id: string): Promise<Person | null> {
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

    return person || null;
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

