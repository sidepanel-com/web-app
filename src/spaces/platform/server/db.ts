import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as platformSchema from "@db/platform/schema";
import * as platformRelations from "@db/platform/relations";

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
  },
});

export type DrizzleClient = typeof db;
