import type { Config } from "drizzle-kit";

export default {
  schema: [
    "./db/product/schema.ts",
    "./db/product/relations.ts",
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
