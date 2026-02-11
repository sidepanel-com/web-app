import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as platformSchema from "@db/platform/schema";
import * as platformRelations from "@db/platform/relations";
import * as productSchema from "@db/product/schema";
import * as productRelations from "@db/product/relations";
import * as integrationsSchema from "@db/integrations/schema";
import * as integrationsRelations from "@db/integrations/relations";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // This allows build to pass without env vars, but runtime will fail if not set
  console.warn("DATABASE_URL is not set");
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString || "", { prepare: false });

export const db = drizzle(client, {
  schema: {
    ...platformSchema,
    ...platformRelations,
    ...productSchema,
    ...productRelations,
    ...integrationsSchema,
    ...integrationsRelations,
  },
});

export type DrizzleClient = typeof db;
