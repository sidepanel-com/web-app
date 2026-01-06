import { SupabaseClient } from "@supabase/supabase-js";
import { BaseEntityService } from "./base-entity.service";

// Example of how custom entities would work in your no-code system
interface CustomEntityConfig {
  tableName: string;
  permissions: {
    read: "all" | "assigned" | "own" | "none";
    create: boolean;
    update: "all" | "assigned" | "own" | "none";
    delete: "all" | "assigned" | "own" | "none";
  };
  fields: CustomField[];
  relationships: CustomRelationship[];
}

interface CustomField {
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select" | "multiselect";
  required: boolean;
  validation?: any;
}

interface CustomRelationship {
  name: string;
  targetEntity: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
}

// Generic service for custom entities defined by tenant owners
export class CustomEntityService extends BaseEntityService {
  private entityConfig: CustomEntityConfig;
  private dangerSupabaseAdmin: SupabaseClient;

  constructor(
    db: any,
    supabaseClient: SupabaseClient,
    permissionContext: any,
    entityConfig: CustomEntityConfig
  ) {
    super(db, permissionContext);
    this.dangerSupabaseAdmin = supabaseClient;
    this.entityConfig = entityConfig;
  }

  // Dynamic permission checking based on tenant-defined rules
  async canRead(entityId?: string): Promise<boolean> {
    const permission = this.entityConfig.permissions.read;

    switch (permission) {
      case "all":
        return await this.hasPermission("read_all");
      case "assigned":
        return entityId ? await this.isAssignedToEntity(entityId) : true;
      case "own":
        return entityId ? await this.isOwnerOfEntity(entityId) : true;
      case "none":
        return false;
      default:
        return false;
    }
  }

  async canCreate(): Promise<boolean> {
    return (
      this.entityConfig.permissions.create &&
      (await this.hasPermission("create"))
    );
  }

  async canUpdate(entityId: string): Promise<boolean> {
    const permission = this.entityConfig.permissions.update;

    switch (permission) {
      case "all":
        return await this.hasPermission("update_all");
      case "assigned":
        return await this.isAssignedToEntity(entityId);
      case "own":
        return await this.isOwnerOfEntity(entityId);
      case "none":
        return false;
      default:
        return false;
    }
  }

  async canDelete(entityId: string): Promise<boolean> {
    const permission = this.entityConfig.permissions.delete;

    switch (permission) {
      case "all":
        return await this.hasPermission("delete_all");
      case "assigned":
        return await this.isAssignedToEntity(entityId);
      case "own":
        return await this.isOwnerOfEntity(entityId);
      case "none":
        return false;
      default:
        return false;
    }
  }

  // CRUD operations for custom entities
  async create(data: Record<string, any>): Promise<any> {
    if (!(await this.canCreate())) {
      throw new Error("Insufficient permissions to create entity");
    }

    // Add tenant scoping and user context
    const entityData = {
      ...data,
      tenant_id: this.permissionContext.tenantId!,
      created_by: this.permissionContext.userId,
      created_at: new Date().toISOString(),
    };

    const { data: result, error } = await this.dangerSupabaseAdmin
      .from(this.entityConfig.tableName)
      .insert(entityData)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async findById(id: string): Promise<any> {
    if (!(await this.canRead(id))) {
      throw new Error("Insufficient permissions to read entity");
    }

    const { data, error } = await this.dangerSupabaseAdmin
      .from(this.entityConfig.tableName)
      .select("*")
      .eq("id", id)
      .eq("tenant_id", this.permissionContext.tenantId!)
      .single();

    if (error) throw error;
    return data;
  }

  async findMany(filters?: Record<string, any>): Promise<any[]> {
    if (!(await this.canRead())) {
      throw new Error("Insufficient permissions to read entities");
    }

    let query = this.dangerSupabaseAdmin
      .from(this.entityConfig.tableName)
      .select("*")
      .eq("tenant_id", this.permissionContext.tenantId!);

    // Apply permission-based filtering
    const permission = this.entityConfig.permissions.read;
    if (permission === "assigned") {
      query = query.eq("assigned_to", this.permissionContext.userId);
    } else if (permission === "own") {
      query = query.eq("created_by", this.permissionContext.userId);
    }

    // Apply custom filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async update(id: string, updates: Record<string, any>): Promise<any> {
    if (!(await this.canUpdate(id))) {
      throw new Error("Insufficient permissions to update entity");
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: this.permissionContext.userId,
    };

    const { data, error } = await this.dangerSupabaseAdmin
      .from(this.entityConfig.tableName)
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", this.permissionContext.tenantId!)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    if (!(await this.canDelete(id))) {
      throw new Error("Insufficient permissions to delete entity");
    }

    const { error } = await this.dangerSupabaseAdmin
      .from(this.entityConfig.tableName)
      .delete()
      .eq("id", id)
      .eq("tenant_id", this.permissionContext.tenantId!);

    if (error) throw error;
  }

  // Helper methods for permission checking
  private async isAssignedToEntity(entityId: string): Promise<boolean> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from(this.entityConfig.tableName)
      .select("assigned_to")
      .eq("id", entityId)
      .eq("tenant_id", this.permissionContext.tenantId!)
      .single();

    if (error) return false;
    return data?.assigned_to === this.permissionContext.userId;
  }

  private async isOwnerOfEntity(entityId: string): Promise<boolean> {
    const { data, error } = await this.dangerSupabaseAdmin
      .from(this.entityConfig.tableName)
      .select("created_by")
      .eq("id", entityId)
      .eq("tenant_id", this.permissionContext.tenantId!)
      .single();

    if (error) return false;
    return data?.created_by === this.permissionContext.userId;
  }

  // Factory method to create service instances for custom entities
  static async createForEntity(
    db: any,
    dangerSupabaseAdmin: SupabaseClient,
    permissionContext: any,
    entityName: string
  ): Promise<CustomEntityService> {
    // In a real implementation, this would fetch the entity configuration
    // from a tenant_entity_configs table or similar
    const entityConfig = await this.getEntityConfig(
      dangerSupabaseAdmin,
      entityName,
      permissionContext.tenantId
    );

    return new CustomEntityService(
      db,
      dangerSupabaseAdmin,
      permissionContext,
      entityConfig
    );
  }

  private static async getEntityConfig(
    dangerSupabaseAdmin: SupabaseClient,
    entityName: string,
    tenantId: string
  ): Promise<CustomEntityConfig> {
    // This would fetch from a configuration table
    // For now, return a mock config
    return {
      tableName: `custom_${entityName.toLowerCase()}`,
      permissions: {
        read: "all",
        create: true,
        update: "own",
        delete: "own",
      },
      fields: [],
      relationships: [],
    };
  }
}
