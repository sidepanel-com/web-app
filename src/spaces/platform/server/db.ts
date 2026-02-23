import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as platformSchema from "@db/platform/schema";
import * as platformRelations from "@db/platform/relations";
import * as ledgerSchema from "@db/ledger/schema";
import * as ledgerRelations from "@db/ledger/relations";
import * as permissionsSchema from "@db/permissions/schema";
import * as permissionsRelations from "@db/permissions/relations";
import * as packagesSchema from "@db/packages/schema";
import * as packagesRelations from "@db/packages/relations";
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
    ...ledgerSchema,
    ...ledgerRelations,
    ...permissionsSchema,
    ...permissionsRelations,
    ...packagesSchema,
    ...packagesRelations,
    ...integrationsSchema,
    ...integrationsRelations,
  },
});

export type DrizzleClient = typeof db;
