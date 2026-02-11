// Types for Pipedream API
export type ProjectEnvironment = "development" | "production";
export type App = "gmail" | "outlook";

interface OAuthTokenRequest {
  grant_type: "client_credentials";
  client_id: string;
  client_secret: string;
  scope?: string;
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CreateConnectTokenRequest {
  external_user_id: string;
  allowed_origins: string[];
  error_redirect_uri: string;
  success_redirect_uri: string;
  webhook_uri?: string;
}

interface CreateConnectTokenResponse {
  token: string;
  connect_link_url: string;
  expires_at: string;
}

export interface PipedreamAccount {
  id: string;
  name: string;
  external_id: string;
  healthy: boolean;
  dead: boolean;
  app: {
    id: string;
    name_slug: string;
    name: string;
    auth_type: string;
  };
  created_at: string;
  updated_at: string;
  expires_at?: string;
  error?: string;
}

interface ListAccountsResponse {
  data: PipedreamAccount[];
  page_info: {
    count: number;
    total_count: number;
    start_cursor?: string;
    end_cursor?: string;
  };
}

export type TriggerProps =
  | {
      id: "gmail-new-email-received";
      version: "0.3.3";
      external_user_id: string;
      configured_props: {
        gmail: {
          authProvisionId: string;
        };
        timer: {
          intervalSeconds: number;
        };
        labels: string[];
        excludeLabels?: string[];
      };
      webhook_url: string;
      emit_on_deploy?: boolean;
    }
  | {
      id: "outlook-tbd";
      version: "xx";
      external_user_id: string;
      configured_props: {
        outlook: {
          authProvisionId: string;
        };
        timer: {
          intervalSeconds: number;
        };
      };
      webhook_url: string;
      emit_on_deploy?: boolean;
    };

export class PipedreamClientWrapper {
  private readonly apiBaseUrl = "https://api.pipedream.com/v1";
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly projectId: string;
  private readonly environment: ProjectEnvironment;

  private oauthToken: {
    accessToken: string;
    expiresAt: Date;
  } | null = null;

  constructor(environment: ProjectEnvironment) {
    this.environment = environment;

    const clientId = process.env.PIPEDREAM_CLIENT_ID;
    const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET;
    const projectId = process.env.PIPEDREAM_PROJECT_ID;

    if (!clientId || !clientSecret || !projectId) {
      throw new Error(
        "Missing required Pipedream environment variables. " +
          `clientId: ${!!clientId}, clientSecret: ${!!clientSecret}, projectId: ${!!projectId}`
      );
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.projectId = projectId;
  }

  public getExternalUserId(orgId: string, userId: string): string {
    return `${orgId}:${userId}`;
  }

  /**
   * Generate an OAuth access token using client credentials
   * Tokens are cached and reused until they expire
   */
  private async getOAuthToken(): Promise<string> {
    // Return cached token if still valid
    if (
      this.oauthToken &&
      Date.now() < this.oauthToken.expiresAt.getTime()
    ) {
      return this.oauthToken.accessToken;
    }

    const requestBody: OAuthTokenRequest = {
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: "connect:*", // Request all connect scopes
    };

    const response = await fetch(`${this.apiBaseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to generate OAuth token: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data: OAuthTokenResponse = await response.json();

    // Cache the token with expiration time (subtract 60 seconds for safety margin)
    const expiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);
    this.oauthToken = {
      accessToken: data.access_token,
      expiresAt,
    };

    return data.access_token;
  }

  /**
   * List all connected accounts for a user
   * Optionally filter by app (gmail, outlook, etc.)
   */
  public async listAccounts(
    orgId: string,
    userId: string,
    app?: App
  ): Promise<PipedreamAccount[]> {
    const accessToken = await this.getOAuthToken();
    const externalUserId = this.getExternalUserId(orgId, userId);

    const url = new URL(
      `${this.apiBaseUrl}/connect/${this.projectId}/accounts`
    );
    url.searchParams.append("external_user_id", externalUserId);
    if (app) {
      url.searchParams.append("app", app);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-pd-environment": this.environment,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to list accounts: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data: ListAccountsResponse = await response.json();
    return data.data;
  }

  /**
   * Create a Connect token for a user
   * This token is used to authenticate the user in the Pipedream Connect UI
   */
  public async createConnectToken(
    orgId: string,
    userId: string,
    app: App,
    provider: string,
    method: string
  ): Promise<{
    token: string;
    connectUrl: string;
    app: App;
    expiresAt: Date;
  }> {
    // Get OAuth access token
    const accessToken = await this.getOAuthToken();
    const externalUserId = this.getExternalUserId(orgId, userId);

    // Use SITE_DOMAIN for consistent domain configuration
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      throw new Error(
        "Missing required environment variable: NEXT_PUBLIC_SITE_URL"
      );
    }
    const siteDomain = process.env.NEXT_PUBLIC_SITE_URL;

    // Build redirect URIs with provider and method parameters
    const baseSuccessUri =
      process.env.PIPEDREAM_SUCCESS_REDIRECT_URI ||
      `${siteDomain}/integrations/callback/success`;
    const baseErrorUri =
      process.env.PIPEDREAM_ERROR_REDIRECT_URI ||
      `${siteDomain}/integrations/callback/error`;

    const successRedirectUri = `${baseSuccessUri}?provider=${encodeURIComponent(
      provider
    )}&method=${encodeURIComponent(method)}&organizationId=${encodeURIComponent(
      orgId
    )}`;
    const errorRedirectUri = `${baseErrorUri}?provider=${encodeURIComponent(
      provider
    )}&method=${encodeURIComponent(method)}&organizationId=${encodeURIComponent(
      orgId
    )}`;

    // Webhook URI for Pipedream to notify us of connection events
    const webhookUri = `${siteDomain}/api/webhooks/pipedream`;

    const requestBody: CreateConnectTokenRequest = {
      external_user_id: externalUserId,
      allowed_origins: [siteDomain],
      error_redirect_uri: errorRedirectUri,
      success_redirect_uri: successRedirectUri,
      webhook_uri: webhookUri,
    };

    const response = await fetch(
      `${this.apiBaseUrl}/connect/${this.projectId}/tokens`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-pd-environment": this.environment,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create Connect token: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data: CreateConnectTokenResponse = await response.json();

    const connectUrl = new URL(data.connect_link_url);
    connectUrl.searchParams.append("app", app);

    return {
      token: data.token,
      connectUrl: connectUrl.toString(),
      app,
      expiresAt: new Date(data.expires_at),
    };
  }

  /**
   * Delete a connected account
   */
  public async deleteAccount(accountId: string): Promise<void> {
    const accessToken = await this.getOAuthToken();

    const response = await fetch(
      `${this.apiBaseUrl}/connect/${this.projectId}/accounts/${accountId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-pd-environment": this.environment,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      // If account is already gone (404), treat as success
      if (response.status === 404) {
        return;
      }
      throw new Error(
        `Failed to delete account: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  }

  /**
   * Create a source (deploy a trigger)
   * This is the same as creating a trigger for a user
   * docs:https://pipedream.com/docs/connect/api-reference/deploy-trigger
   */
  public async createSource(
    orgId: string,
    userId: string,
    opts: TriggerProps
  ): Promise<{
    id: string;
    name: string;
    configured_props: Record<string, any>;
    active: boolean;
    created_at: number;
    updated_at: number;
  }> {
    const accessToken = await this.getOAuthToken();
    const externalUserId = this.getExternalUserId(orgId, userId);

    const requestBody = {
      external_user_id: externalUserId,
      id: opts.id,
      version: opts.version,
      configured_props: opts.configured_props,
      webhook_url: opts.webhook_url,
    };

    const response = await fetch(
      `${this.apiBaseUrl}/connect/${this.projectId}/triggers/deploy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-pd-environment": this.environment,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create source: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    return data?.data;
  }

  /**
   * List all sources for the current project (list triggers by external_user_id & project_id)
   * This is really a list of all triggers for the current user
   * docs: https://pipedream.com/docs/connect/api-reference/list-triggers
   *
   * endpoint: https://api.pipedream.com/v1/connect/{project_id}/deployed-triggers
   */
  public async listSources(orgId: string, userId: string) {
    const accessToken = await this.getOAuthToken();
    const externalUserId = this.getExternalUserId(orgId, userId);

    const query = new URLSearchParams({
      external_user_id: externalUserId,
    });

    const response = await fetch(
      `${this.apiBaseUrl}/connect/${this.projectId}/deployed-triggers?${query.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-pd-environment": this.environment,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to list sources: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    return data;
  }

  public async deleteSource(
    orgId: string,
    userId: string,
    sourceId: string
  ): Promise<void> {
    const accessToken = await this.getOAuthToken();

    const query = new URLSearchParams({
      external_user_id: this.getExternalUserId(orgId, userId),
    });

    const response = await fetch(
      `${this.apiBaseUrl}/connect/${this.projectId}/deployed-triggers/${sourceId}?${query.toString()}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-pd-environment": this.environment,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      // If source is already gone (404), treat as success
      if (response.status === 404) {
        return;
      }
      throw new Error(
        `Failed to delete source: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  }

  async getAccount(accountId: string) {
    // Mock implementation
    return {
      id: accountId,
      email: "user@example.com", // Would come from Pipedream
      metadata: {},
    };
  }

  async createWebhook(integrationId: string, targetUrl: string) {
    // Mock implementation - would create a workflow in Pipedream
    return {
      id: "pd_webhook_" + integrationId,
      url: targetUrl,
    };
  }
}

