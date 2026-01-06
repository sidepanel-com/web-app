CREATE TYPE "public"."comm_type" AS ENUM('email', 'phone', 'linkedin', 'calendar', 'slack', 'whatsapp', 'other');--> statement-breakpoint
CREATE TABLE "product"."call_comms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"call_id" uuid NOT NULL,
	"comm_id" uuid NOT NULL,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "product"."calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"external_id" text,
	"duration_seconds" text,
	"recording_url" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product"."comms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" "comm_type" NOT NULL,
	"value" jsonb NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product"."comms_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"comm_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product"."comms_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"comm_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product"."companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"logo_url" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product"."email_comms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email_id" uuid NOT NULL,
	"comm_id" uuid NOT NULL,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "product"."emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"external_id" text,
	"subject" text,
	"body" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product"."meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ical_uid" text NOT NULL,
	"owner_comm_id" uuid NOT NULL,
	"title" text,
	"description" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"recording_url" text,
	"transcript_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product"."meetings_comms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"meeting_id" uuid NOT NULL,
	"comm_id" uuid NOT NULL,
	"role" text,
	"response_status" text
);
--> statement-breakpoint
CREATE TABLE "product"."message_comms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"comm_id" uuid NOT NULL,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "product"."messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"external_id" text,
	"body" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product"."people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"first_name" text,
	"last_name" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product"."people_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"role" text,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "product"."items" CASCADE;--> statement-breakpoint
ALTER TABLE "product"."call_comms" ADD CONSTRAINT "call_comms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."calls" ADD CONSTRAINT "calls_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."comms" ADD CONSTRAINT "comms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."comms_companies" ADD CONSTRAINT "comms_companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."comms_people" ADD CONSTRAINT "comms_people_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."companies" ADD CONSTRAINT "companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."email_comms" ADD CONSTRAINT "email_comms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."emails" ADD CONSTRAINT "emails_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."meetings" ADD CONSTRAINT "meetings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."meetings_comms" ADD CONSTRAINT "meetings_comms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."message_comms" ADD CONSTRAINT "message_comms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."messages" ADD CONSTRAINT "messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."people" ADD CONSTRAINT "people_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product"."people_companies" ADD CONSTRAINT "people_companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "call_comms_tenant_id_idx" ON "product"."call_comms" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "calls_tenant_id_idx" ON "product"."calls" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "comms_tenant_id_idx" ON "product"."comms" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "comms_companies_tenant_id_idx" ON "product"."comms_companies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "comms_people_tenant_id_idx" ON "product"."comms_people" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "companies_tenant_id_idx" ON "product"."companies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "email_comms_tenant_id_idx" ON "product"."email_comms" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "emails_tenant_id_idx" ON "product"."emails" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "meetings_tenant_id_idx" ON "product"."meetings" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meetings_tenant_ical_uid_unique" ON "product"."meetings" USING btree ("tenant_id","ical_uid");--> statement-breakpoint
CREATE INDEX "meetings_comms_tenant_id_idx" ON "product"."meetings_comms" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "message_comms_tenant_id_idx" ON "product"."message_comms" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "messages_tenant_id_idx" ON "product"."messages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "people_tenant_id_idx" ON "product"."people" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "people_companies_tenant_id_idx" ON "product"."people_companies" USING btree ("tenant_id");