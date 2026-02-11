import { type Connection } from "@db/integrations/types";
import { BaseIntegrationAdapter } from "@/spaces/integrations/core/base-adapter";
import {
  IntegrationMethod,
  IntegrationProvider,
  IntegrationType,
  type ConnectionResult,
} from "@/spaces/integrations/core/types";
import { PipedreamClientWrapper, type ProjectEnvironment } from "@/spaces/integrations/lib/pipedream/client";

export class GmailPipedreamAdapter extends BaseIntegrationAdapter {
  type = IntegrationType.EMAIL;
  provider = IntegrationProvider.GOOGLE;
  method = IntegrationMethod.PIPEDREAM_CONNECT;

  private client: PipedreamClientWrapper;

  constructor() {
    super();
    const pdEnv = process.env.PIPEDREAM_ENV || "development";

    this.client = new PipedreamClientWrapper(pdEnv as ProjectEnvironment);
  }

  async connect(orgId: string, userId: string): Promise<ConnectionResult> {
    // Check if user already has a connected Gmail account
    const existingAccounts = await this.client.listAccounts(
      orgId,
      userId,
      "gmail"
    );

    // Filter for healthy (active) accounts
    const activeAccount = existingAccounts.find(
      (account) => account.healthy && !account.dead
    );

    if (activeAccount) {
      // User already has an active connection
      return {
        connectionData: {
          accountId: activeAccount.id,
          accountName: activeAccount.name,
        },
        providerAccountId: activeAccount.id,
      };
    }

    // No existing connection, create a new connect token
    const { token, connectUrl } = await this.client.createConnectToken(
      orgId,
      userId,
      "gmail",
      this.provider,
      this.method
    );

    return {
      connectionData: {
        connectToken: token,
        connectUrl: connectUrl,
        externalUserId: userId,
      },
      providerAccountId: "pending", // Will be updated after callback
    };
  }

  async disconnect(connection: Connection): Promise<void> {
    // Call Pipedream to delete all accounts for this user
    try {
      if (!connection.profileId) {
        return;
      }

      // List all accounts for this user
      const accounts = await this.client.listAccounts(
        connection.tenantId,
        connection.profileId,
        "gmail"
      );

      // Delete each account
      await Promise.all(
        accounts.map((account) =>
          this.client.deleteAccount(account.id).catch((err) => {
            console.error(
              `Failed to delete Pipedream account ${account.id}:`,
              err
            );
          })
        )
      );
    } catch (error) {
      console.error("Failed to disconnect Pipedream accounts:", error);
      // We still want to allow the local disconnection to proceed
    }
  }

  async sendEmail(connection: Connection, data: any): Promise<void> {
    // Trigger Pipedream workflow to send email
    console.log("Sending email via Pipedream", data);
  }

  async deployIngestor(
    connection: Connection,
    type: string
  ): Promise<{ id: string; name: string }> {
    // Map internal type to Pipedream component

    console.dir({ connection, type }, { depth: null });

    if (type !== "new_email") {
      throw new Error(`Unsupported ingestor type: ${type}`);
    }
    if (!process.env.INGESTOR_ENDPOINT_GMAIL) {
      throw new Error("INGESTOR_ENDPOINT_GMAIL is not set");
    }
    if (!connection.profileId) {
      throw new Error("Connection must have a profileId for user-owned integration");
    }

    const webhookUrl =
      process.env.INGESTOR_ENDPOINT_GMAIL +
      "?connectionId=" +
      connection.id;
    
    const source = await this.client.createSource(
      connection.tenantId,
      connection.profileId,
      {
        id: "gmail-new-email-received",
        version: "0.3.3",
        external_user_id: connection.profileId,
        configured_props: {
          gmail: {
            authProvisionId: connection.externalId || "", // Assuming externalId stores the authProvisionId/accountId
          },
          timer: {
            intervalSeconds: 15, // Poll every 15 seconds
          },
          labels: ["INBOX", "SENT"],
        },
        webhook_url: webhookUrl,
        emit_on_deploy: false,
      }
    );

    return {
      id: source.id,
      name: source.name,
    };
  }

  async listSources(
    connection: Connection
  ): Promise<{ sourceId: string; sourceName: string }[]> {
    if (!connection.profileId) {
        return [];
    }

    const sources = await this.client.listSources(
      connection.tenantId,
      connection.profileId
    );
    
    if (!sources || !Array.isArray(sources.data)) {
        return [];
    }

    return sources.data.map((source: any) => ({
      sourceId: source.id,
      sourceName: source.name,
    }));
  }

  async removeIngestor(
    connection: Connection,
    ingestorId: string
  ): Promise<void> {
    if (!connection.profileId) {
        return;
    }

    await this.client.deleteSource(
      connection.tenantId,
      connection.profileId,
      ingestorId
    );
  }
}

