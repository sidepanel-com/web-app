import { eq, and } from "drizzle-orm";
import { db } from "@/spaces/platform/server/db";
import { connections } from "@db/integrations/schema";
import { BaseEntityService, type PermissionContext } from "@/spaces/platform/server/base-entity.service";
import { GmailPipedreamAdapter } from "@/spaces/integrations/lib/providers/google/pipedream-adapter";
import { IntegrationMethod, IntegrationProvider } from "@/spaces/integrations/core/types";
import { userProfiles } from "@db/platform/schema";

export class IntegrationService extends BaseEntityService {
  private adapters: Record<string, any> = {};

  constructor(
    drizzleClient: typeof db,
    permissionContext: PermissionContext
  ) {
    super(drizzleClient, permissionContext);
  }

  // Abstract methods from BaseEntityService
  async canRead(entityId?: string): Promise<boolean> {
    return true; // Simplified for now
  }
  async canCreate(): Promise<boolean> {
    return true; // Simplified for now
  }
  async canUpdate(entityId: string): Promise<boolean> {
    return true; // Simplified for now
  }
  async canDelete(entityId: string): Promise<boolean> {
    return true; // Simplified for now
  }

  private getAdapter(provider: IntegrationProvider, method: IntegrationMethod) {
    const key = `${provider}:${method}`;
    if (!this.adapters[key]) {
      if (provider === IntegrationProvider.GOOGLE && method === IntegrationMethod.PIPEDREAM_CONNECT) {
        this.adapters[key] = new GmailPipedreamAdapter();
      }
    }
    
    const adapter = this.adapters[key];
    if (!adapter) {
      throw new Error(`No adapter found for provider ${provider} and method ${method}`);
    }
    return adapter;
  }

  async listConnections(tenantId: string) {
    // For now, let's return connections for the current user in this tenant
    // or tenant-wide connections (profileId is null)
    
    const [userProfile] = await this.db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, this.permissionContext.userId));

    if (!userProfile) {
        throw new Error("User profile not found");
    }

    return await this.db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.tenantId, tenantId),
          // Allow user-owned or tenant-owned
          eq(connections.profileId, userProfile.id)
        )
      );
  }

  async connect(tenantId: string, provider: IntegrationProvider, method: IntegrationMethod) {
    const adapter = this.getAdapter(provider, method);
    
    const [userProfile] = await this.db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, this.permissionContext.userId));

    if (!userProfile) {
        throw new Error("User profile not found");
    }

    // adapter.connect handles checking for existing accounts if needed
    // or generating the connect token
    const result = await adapter.connect(tenantId, userProfile.id);

    return result;
  }

  async finalizeConnection(
    tenantId: string,
    provider: IntegrationProvider,
    method: IntegrationMethod,
    providerAccountId: string,
    connectionData: any
  ) {
    const [userProfile] = await this.db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, this.permissionContext.userId));

    if (!userProfile) {
        throw new Error("User profile not found");
    }

    // Upsert the connection
    const [existing] = await this.db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.tenantId, tenantId),
          eq(connections.profileId, userProfile.id),
          eq(connections.provider, provider as any)
        )
      );

    if (existing) {
      const [updated] = await this.db
        .update(connections)
        .set({
          externalId: providerAccountId,
          status: "active",
          credentials: {}, // Pipedream handles tokens, we just store the account reference
          metadata: connectionData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(connections.id, existing.id))
        .returning();
      
      // If it's a Gmail connection, deploy the ingestor
      if (provider === IntegrationProvider.GOOGLE) {
          const adapter = this.getAdapter(provider, method);
          await adapter.deployIngestor(updated as any, "new_email");
      }

      return updated;
    } else {
      const [newConn] = await this.db
        .insert(connections)
        .values({
          tenantId,
          profileId: userProfile.id,
          provider: provider as any,
          externalId: providerAccountId,
          status: "active",
          credentials: {},
          metadata: connectionData,
          enabledCapabilities: ["sync_inbox", "send_email"],
        })
        .returning();

      // If it's a Gmail connection, deploy the ingestor
      if (provider === IntegrationProvider.GOOGLE) {
          const adapter = this.getAdapter(provider, method);
          await adapter.deployIngestor(newConn as any, "new_email");
      }

      return newConn;
    }
  }

  async disconnect(tenantId: string, provider: IntegrationProvider, method: IntegrationMethod) {
    const [userProfile] = await this.db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, this.permissionContext.userId));

    if (!userProfile) {
        throw new Error("User profile not found");
    }

    const [connection] = await this.db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.tenantId, tenantId),
          eq(connections.profileId, userProfile.id),
          eq(connections.provider, provider as any)
        )
      );

    if (connection) {
      const adapter = this.getAdapter(provider, method);
      
      // Cleanup ingestors first
      const sources = await adapter.listSources(connection as any);
      for (const source of sources) {
          await adapter.removeIngestor(connection as any, source.sourceId);
      }

      // Cleanup provider side
      await adapter.disconnect(connection as any);

      // Delete from DB
      await this.db.delete(connections).where(eq(connections.id, connection.id));
    }
  }

  static create(drizzleClient: typeof db, userId: string, tenantId?: string) {
    return new IntegrationService(drizzleClient, { userId, tenantId });
  }
}

