CREATE TYPE "integrations"."ingest_source" AS ENUM('pipedream', 'native');--> statement-breakpoint
CREATE TYPE "integrations"."listener_status" AS ENUM('active', 'error', 'expired', 'disabled');--> statement-breakpoint
CREATE TABLE "integrations"."listeners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"provider" "integrations"."connection_provider" NOT NULL,
	"service" text NOT NULL,
	"resource_type" text NOT NULL,
	"ingest_source" "integrations"."ingest_source" NOT NULL,
	"provider_listener_id" text,
	"status" "integrations"."listener_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone,
	"last_event_at" timestamp with time zone,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integrations"."raw_records" ADD COLUMN "listener_id" uuid;--> statement-breakpoint
ALTER TABLE "integrations"."raw_records" ADD COLUMN "ingest_source" "integrations"."ingest_source" NOT NULL;--> statement-breakpoint
ALTER TABLE "integrations"."listeners" ADD CONSTRAINT "listeners_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."listeners" ADD CONSTRAINT "listeners_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integrations"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listeners_tenant_id_idx" ON "integrations"."listeners" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "listeners_connection_id_idx" ON "integrations"."listeners" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "listeners_status_idx" ON "integrations"."listeners" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listeners_expires_at_idx" ON "integrations"."listeners" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "listeners_connection_service_resource_unique" ON "integrations"."listeners" USING btree ("connection_id","service","resource_type") WHERE "integrations"."listeners"."status" = 'active';--> statement-breakpoint
ALTER TABLE "integrations"."raw_records" ADD CONSTRAINT "raw_records_listener_id_fkey" FOREIGN KEY ("listener_id") REFERENCES "integrations"."listeners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "raw_records_listener_id_idx" ON "integrations"."raw_records" USING btree ("listener_id");