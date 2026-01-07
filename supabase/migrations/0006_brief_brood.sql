CREATE SCHEMA "integrations";
--> statement-breakpoint
CREATE TYPE "integrations"."connection_provider" AS ENUM('google', 'slack', 'quickbooks', 'outlook', 'twilio', 'recall_ai', 'whatsapp');--> statement-breakpoint
CREATE TYPE "integrations"."connection_status" AS ENUM('active', 'error', 'expired', 'disconnected');--> statement-breakpoint
CREATE TYPE "integrations"."raw_record_status" AS ENUM('pending', 'processed', 'failed');--> statement-breakpoint
CREATE TABLE "integrations"."connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"profile_id" uuid,
	"provider" "integrations"."connection_provider" NOT NULL,
	"external_id" text,
	"status" "integrations"."connection_status" DEFAULT 'active' NOT NULL,
	"enabled_capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"credentials" jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations"."raw_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"provider" "integrations"."connection_provider" NOT NULL,
	"external_id" text NOT NULL,
	"resource_type" text NOT NULL,
	"raw_data" jsonb NOT NULL,
	"status" "integrations"."raw_record_status" DEFAULT 'pending' NOT NULL,
	"processing_error" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "integrations"."sync_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"resource_type" text NOT NULL,
	"cursor" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integrations"."connections" ADD CONSTRAINT "connections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."connections" ADD CONSTRAINT "connections_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "platform"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."raw_records" ADD CONSTRAINT "raw_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."raw_records" ADD CONSTRAINT "raw_records_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integrations"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."sync_state" ADD CONSTRAINT "sync_state_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."sync_state" ADD CONSTRAINT "sync_state_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integrations"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "connections_tenant_id_idx" ON "integrations"."connections" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "connections_profile_id_idx" ON "integrations"."connections" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "connections_tenant_provider_unique" ON "integrations"."connections" USING btree ("tenant_id","provider") WHERE "integrations"."connections"."profile_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "connections_tenant_profile_provider_unique" ON "integrations"."connections" USING btree ("tenant_id","profile_id","provider") WHERE "integrations"."connections"."profile_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "raw_records_tenant_id_idx" ON "integrations"."raw_records" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "raw_records_connection_id_idx" ON "integrations"."raw_records" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "raw_records_status_idx" ON "integrations"."raw_records" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "raw_records_provider_external_id_unique" ON "integrations"."raw_records" USING btree ("connection_id","external_id");--> statement-breakpoint
CREATE INDEX "sync_state_connection_id_idx" ON "integrations"."sync_state" USING btree ("connection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_state_connection_resource_unique" ON "integrations"."sync_state" USING btree ("connection_id","resource_type");