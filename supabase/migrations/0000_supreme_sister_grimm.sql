CREATE SCHEMA "ledger";
--> statement-breakpoint
CREATE SCHEMA "permissions";
--> statement-breakpoint
CREATE SCHEMA "packages";
--> statement-breakpoint
CREATE SCHEMA "platform";
--> statement-breakpoint
CREATE SCHEMA "integrations";
--> statement-breakpoint
CREATE TYPE "public"."access_level" AS ENUM('public', 'internal', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('email', 'meeting', 'call', 'message', 'opportunity_created', 'stage_changed', 'note_added', 'integration_connected', 'ai_summary_generated', 'permission_changed');--> statement-breakpoint
CREATE TYPE "public"."comm_type" AS ENUM('email', 'phone', 'linkedin', 'slack', 'whatsapp', 'other');--> statement-breakpoint
CREATE TYPE "platform"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "platform"."subscription_tier" AS ENUM('free', 'basic', 'premium', 'enterprise');--> statement-breakpoint
CREATE TYPE "platform"."tenant_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "platform"."tenant_user_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "platform"."tenant_user_status" AS ENUM('active', 'inactive', 'pending');--> statement-breakpoint
CREATE TYPE "integrations"."connection_provider" AS ENUM('google', 'slack', 'quickbooks', 'outlook', 'twilio', 'recall_ai', 'whatsapp');--> statement-breakpoint
CREATE TYPE "integrations"."connection_status" AS ENUM('active', 'error', 'expired', 'disconnected');--> statement-breakpoint
CREATE TYPE "integrations"."ingest_source" AS ENUM('pipedream', 'native');--> statement-breakpoint
CREATE TYPE "integrations"."listener_status" AS ENUM('active', 'error', 'expired', 'disabled');--> statement-breakpoint
CREATE TYPE "integrations"."raw_record_status" AS ENUM('pending', 'processed', 'failed');--> statement-breakpoint
CREATE TABLE "ledger"."activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" "activity_type" NOT NULL,
	"source_id" uuid,
	"actor_comm_id" uuid,
	"actor_person_id" uuid,
	"occurred_at" timestamp with time zone NOT NULL,
	"access_level" "access_level" DEFAULT 'internal' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."call_comms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"call_id" uuid NOT NULL,
	"comm_id" uuid NOT NULL,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "ledger"."calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"external_id" text,
	"duration_seconds" text,
	"recording_url" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."comms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" "comm_type" NOT NULL,
	"value" jsonb NOT NULL,
	"canonical_value" text NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."comms_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"comm_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."comms_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"comm_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."company_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."company_websites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"url" text NOT NULL,
	"type" text,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."email_comms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email_id" uuid NOT NULL,
	"comm_id" uuid NOT NULL,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "ledger"."emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"external_id" text,
	"subject" text,
	"body" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."meetings" (
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
CREATE TABLE "ledger"."meetings_comms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"meeting_id" uuid NOT NULL,
	"comm_id" uuid NOT NULL,
	"role" text,
	"response_status" text
);
--> statement-breakpoint
CREATE TABLE "ledger"."message_comms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"comm_id" uuid NOT NULL,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "ledger"."messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"external_id" text,
	"body" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"first_name" text,
	"last_name" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."people_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"role" text,
	"is_primary" boolean DEFAULT false,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions"."member_profile_org_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"member_profile_id" uuid NOT NULL,
	"org_unit_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions"."member_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tenant_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions"."org_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"parent_org_unit_id" uuid,
	"path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages"."workspace_thread_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"owner_member_profile_id" uuid NOT NULL,
	"owner_org_unit_id" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages"."workspace_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"external_thread_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_by_profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."tenant_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"profile_id" uuid,
	"role" "platform"."tenant_user_role" NOT NULL,
	"status" "platform"."invitation_status" DEFAULT 'pending',
	"invited_by" uuid,
	"invited_by_email" text,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_invitations_token_key" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "platform"."tenant_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role" "platform"."tenant_user_role" NOT NULL,
	"status" "platform"."tenant_user_status" DEFAULT 'active',
	"invited_by" uuid,
	"invited_by_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"status" "platform"."tenant_status" DEFAULT 'active',
	"subscription_tier" "platform"."subscription_tier" DEFAULT 'free',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"deactivated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "integrations"."raw_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"listener_id" uuid,
	"ingest_source" "integrations"."ingest_source" NOT NULL,
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
ALTER TABLE "ledger"."activities" ADD CONSTRAINT "activities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."call_comms" ADD CONSTRAINT "call_comms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."calls" ADD CONSTRAINT "calls_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."comms" ADD CONSTRAINT "comms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."comms_companies" ADD CONSTRAINT "comms_companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."comms_people" ADD CONSTRAINT "comms_people_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."companies" ADD CONSTRAINT "companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."company_domains" ADD CONSTRAINT "company_domains_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."company_domains" ADD CONSTRAINT "company_domains_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "ledger"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."company_websites" ADD CONSTRAINT "company_websites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."company_websites" ADD CONSTRAINT "company_websites_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "ledger"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."email_comms" ADD CONSTRAINT "email_comms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."emails" ADD CONSTRAINT "emails_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."meetings" ADD CONSTRAINT "meetings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."meetings_comms" ADD CONSTRAINT "meetings_comms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."message_comms" ADD CONSTRAINT "message_comms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."messages" ADD CONSTRAINT "messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."people" ADD CONSTRAINT "people_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."people_companies" ADD CONSTRAINT "people_companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions"."member_profile_org_units" ADD CONSTRAINT "member_profile_org_units_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions"."member_profile_org_units" ADD CONSTRAINT "member_profile_org_units_member_profile_id_fkey" FOREIGN KEY ("member_profile_id") REFERENCES "permissions"."member_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions"."member_profile_org_units" ADD CONSTRAINT "member_profile_org_units_org_unit_id_fkey" FOREIGN KEY ("org_unit_id") REFERENCES "permissions"."org_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions"."member_profiles" ADD CONSTRAINT "member_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions"."member_profiles" ADD CONSTRAINT "member_profiles_tenant_user_id_fkey" FOREIGN KEY ("tenant_user_id") REFERENCES "platform"."tenant_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions"."org_units" ADD CONSTRAINT "org_units_parent_org_unit_id_org_units_id_fk" FOREIGN KEY ("parent_org_unit_id") REFERENCES "permissions"."org_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions"."org_units" ADD CONSTRAINT "org_units_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages"."workspace_thread_assignments" ADD CONSTRAINT "workspace_thread_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages"."workspace_thread_assignments" ADD CONSTRAINT "workspace_thread_assignments_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "packages"."workspace_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages"."workspace_thread_assignments" ADD CONSTRAINT "workspace_thread_assignments_owner_member_fkey" FOREIGN KEY ("owner_member_profile_id") REFERENCES "permissions"."member_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages"."workspace_thread_assignments" ADD CONSTRAINT "workspace_thread_assignments_owner_org_fkey" FOREIGN KEY ("owner_org_unit_id") REFERENCES "permissions"."org_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages"."workspace_threads" ADD CONSTRAINT "workspace_threads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."api_keys" ADD CONSTRAINT "api_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."api_keys" ADD CONSTRAINT "api_keys_created_by_profile_id_fkey" FOREIGN KEY ("created_by_profile_id") REFERENCES "platform"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."tenant_invitations" ADD CONSTRAINT "tenant_invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."tenant_invitations" ADD CONSTRAINT "tenant_invitations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "platform"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."tenant_invitations" ADD CONSTRAINT "tenant_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "platform"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."tenant_users" ADD CONSTRAINT "tenant_users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "platform"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."tenant_users" ADD CONSTRAINT "tenant_users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "platform"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."connections" ADD CONSTRAINT "connections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."connections" ADD CONSTRAINT "connections_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "platform"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."listeners" ADD CONSTRAINT "listeners_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."listeners" ADD CONSTRAINT "listeners_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integrations"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."raw_records" ADD CONSTRAINT "raw_records_listener_id_fkey" FOREIGN KEY ("listener_id") REFERENCES "integrations"."listeners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."raw_records" ADD CONSTRAINT "raw_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."raw_records" ADD CONSTRAINT "raw_records_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integrations"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."sync_state" ADD CONSTRAINT "sync_state_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations"."sync_state" ADD CONSTRAINT "sync_state_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integrations"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_tenant_id_idx" ON "ledger"."activities" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "activities_occurred_at_idx" ON "ledger"."activities" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "call_comms_tenant_id_idx" ON "ledger"."call_comms" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "calls_tenant_id_idx" ON "ledger"."calls" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "comms_tenant_id_idx" ON "ledger"."comms" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comms_tenant_type_canonical_value_unique" ON "ledger"."comms" USING btree ("tenant_id","type","canonical_value");--> statement-breakpoint
CREATE INDEX "comms_companies_tenant_id_idx" ON "ledger"."comms_companies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "comms_people_tenant_id_idx" ON "ledger"."comms_people" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "companies_tenant_id_idx" ON "ledger"."companies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "email_comms_tenant_id_idx" ON "ledger"."email_comms" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "emails_tenant_id_idx" ON "ledger"."emails" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "meetings_tenant_id_idx" ON "ledger"."meetings" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meetings_tenant_ical_uid_unique" ON "ledger"."meetings" USING btree ("tenant_id","ical_uid");--> statement-breakpoint
CREATE INDEX "meetings_comms_tenant_id_idx" ON "ledger"."meetings_comms" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "message_comms_tenant_id_idx" ON "ledger"."message_comms" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "messages_tenant_id_idx" ON "ledger"."messages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "people_tenant_id_idx" ON "ledger"."people" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "people_companies_tenant_id_idx" ON "ledger"."people_companies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "member_profile_org_units_tenant_id_idx" ON "permissions"."member_profile_org_units" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "member_profile_org_units_org_unit_id_idx" ON "permissions"."member_profile_org_units" USING btree ("org_unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_profile_org_units_member_org_unique" ON "permissions"."member_profile_org_units" USING btree ("member_profile_id","org_unit_id");--> statement-breakpoint
CREATE INDEX "member_profiles_tenant_id_idx" ON "permissions"."member_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_profiles_tenant_user_id_unique" ON "permissions"."member_profiles" USING btree ("tenant_user_id");--> statement-breakpoint
CREATE INDEX "org_units_tenant_id_idx" ON "permissions"."org_units" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "org_units_tenant_id_path_idx" ON "permissions"."org_units" USING btree ("tenant_id","path");--> statement-breakpoint
CREATE INDEX "workspace_thread_assignments_tenant_id_idx" ON "packages"."workspace_thread_assignments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "workspace_thread_assignments_owner_member_idx" ON "packages"."workspace_thread_assignments" USING btree ("owner_member_profile_id");--> statement-breakpoint
CREATE INDEX "workspace_thread_assignments_owner_org_idx" ON "packages"."workspace_thread_assignments" USING btree ("owner_org_unit_id");--> statement-breakpoint
CREATE INDEX "workspace_threads_tenant_id_idx" ON "packages"."workspace_threads" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_threads_tenant_external_unique" ON "packages"."workspace_threads" USING btree ("tenant_id","external_thread_id");--> statement-breakpoint
CREATE INDEX "api_keys_tenant_id_idx" ON "platform"."api_keys" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "api_keys_key_prefix_idx" ON "platform"."api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "tenant_invitations_tenant_id_idx" ON "platform"."tenant_invitations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_invitations_profile_id_idx" ON "platform"."tenant_invitations" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_users_tenant_id_user_id_unique" ON "platform"."tenant_users" USING btree ("tenant_id","profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_slug_unique" ON "platform"."tenants" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_user_id_unique" ON "platform"."user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "connections_tenant_id_idx" ON "integrations"."connections" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "connections_profile_id_idx" ON "integrations"."connections" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "connections_tenant_provider_unique" ON "integrations"."connections" USING btree ("tenant_id","provider") WHERE "integrations"."connections"."profile_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "connections_tenant_profile_provider_unique" ON "integrations"."connections" USING btree ("tenant_id","profile_id","provider") WHERE "integrations"."connections"."profile_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "listeners_tenant_id_idx" ON "integrations"."listeners" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "listeners_connection_id_idx" ON "integrations"."listeners" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "listeners_status_idx" ON "integrations"."listeners" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listeners_expires_at_idx" ON "integrations"."listeners" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "listeners_connection_service_resource_unique" ON "integrations"."listeners" USING btree ("connection_id","service","resource_type") WHERE "integrations"."listeners"."status" = 'active';--> statement-breakpoint
CREATE INDEX "raw_records_tenant_id_idx" ON "integrations"."raw_records" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "raw_records_connection_id_idx" ON "integrations"."raw_records" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "raw_records_status_idx" ON "integrations"."raw_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "raw_records_listener_id_idx" ON "integrations"."raw_records" USING btree ("listener_id");--> statement-breakpoint
CREATE UNIQUE INDEX "raw_records_provider_external_id_unique" ON "integrations"."raw_records" USING btree ("connection_id","external_id");--> statement-breakpoint
CREATE INDEX "sync_state_connection_id_idx" ON "integrations"."sync_state" USING btree ("connection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_state_connection_resource_unique" ON "integrations"."sync_state" USING btree ("connection_id","resource_type");