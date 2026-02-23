import type { Config } from "drizzle-kit";

export default {
  schema: [
    "./db/ledger/schema.ts",
    "./db/ledger/relations.ts",
    "./db/permissions/schema.ts",
    "./db/permissions/relations.ts",
    "./db/packages/schema.ts",
    "./db/packages/relations.ts",
    "./db/platform/schema.ts",
    "./db/platform/relations.ts",
    "./db/integrations/schema.ts",
    "./db/integrations/relations.ts",
  ],
  out: "./supabase/migrations",
  dialect: "postgresql",
  strict: true,
  verbose: true,
} satisfies Config;
