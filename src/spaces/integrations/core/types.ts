export enum IntegrationType {
  EMAIL = "email",
  CALENDAR = "calendar",
  CRM = "crm",
  COMMUNICATION = "communication",
}

export enum IntegrationProvider {
  GOOGLE = "google",
  OUTLOOK = "outlook",
  SLACK = "slack",
  QUICKBOOKS = "quickbooks",
  TWILIO = "twilio",
  RECALL_AI = "recall_ai",
  WHATSAPP = "whatsapp",
}

export enum IntegrationMethod {
  PIPEDREAM_CONNECT = "pipedream_connect",
  NATIVE_OAUTH = "native_oauth",
  API_KEY = "api_key",
}

export interface ConnectionResult {
  connectionData: {
    accountId?: string;
    accountName?: string;
    connectToken?: string;
    connectUrl?: string;
    externalUserId?: string;
    [key: string]: any;
  };
  providerAccountId: string;
}

