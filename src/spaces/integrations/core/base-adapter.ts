import { type Connection } from "@db/integrations/types";
import {
  type IntegrationType,
  type IntegrationProvider,
  type IntegrationMethod,
  type ConnectionResult,
} from "./types";

export abstract class BaseIntegrationAdapter {
  abstract type: IntegrationType;
  abstract provider: IntegrationProvider;
  abstract method: IntegrationMethod;

  /**
   * Initialize a connection for a user or tenant
   */
  abstract connect(orgId: string, userId: string): Promise<ConnectionResult>;

  /**
   * Disconnect and cleanup resources
   */
  abstract disconnect(connection: Connection): Promise<void>;

  /**
   * Deploy an ingestor (e.g., a Pipedream trigger or a native webhook)
   */
  abstract deployIngestor(
    connection: Connection,
    type: string
  ): Promise<{ id: string; name: string }>;

  /**
   * List active sources/ingestors
   */
  abstract listSources(
    connection: Connection
  ): Promise<{ sourceId: string; sourceName: string }[]>;

  /**
   * Remove an active ingestor
   */
  abstract removeIngestor(
    connection: Connection,
    ingestorId: string
  ): Promise<void>;
}

