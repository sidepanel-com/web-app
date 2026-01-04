import { eq, and } from "drizzle-orm";
import { db } from "@/spaces/platform/server/db";
import { companies } from "@db/product/schema";
import { BaseEntityService, PermissionContext } from "@/spaces/platform/server/base-entity.service";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

type Company = InferSelectModel<typeof companies>;
type NewCompany = InferInsertModel<typeof companies>;
type CompanyUpdate = Partial<Omit<Company, "id" | "tenantId" | "createdAt" | "updatedAt">>;

export class CompaniesService extends BaseEntityService {
  constructor(
    drizzleClient: typeof db,
    permissionContext: PermissionContext
  ) {
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

  async getCompanyById(id: string): Promise<Company | null> {
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

    return company || null;
  }

  async createCompany(data: Omit<NewCompany, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Company> {
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

