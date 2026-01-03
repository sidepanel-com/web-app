CREATE SCHEMA "platform";
--> statement-breakpoint
CREATE TYPE "platform"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "platform"."subscription_tier" AS ENUM('free', 'basic', 'premium', 'enterprise');--> statement-breakpoint
CREATE TYPE "platform"."tenant_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "platform"."tenant_user_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "platform"."tenant_user_status" AS ENUM('active', 'inactive', 'pending');--> statement-breakpoint
CREATE TABLE "platform"."tenant_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role" "platform"."tenant_user_role" NOT NULL,
	"status" "platform"."tenant_user_status" DEFAULT 'active',
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
ALTER TABLE "platform"."tenant_invitations" ADD CONSTRAINT "tenant_invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."tenant_invitations" ADD CONSTRAINT "tenant_invitations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "platform"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."tenant_invitations" ADD CONSTRAINT "tenant_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "platform"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."tenant_users" ADD CONSTRAINT "tenant_users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "platform"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."tenant_users" ADD CONSTRAINT "tenant_users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "platform"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_invitations_tenant_id_idx" ON "platform"."tenant_invitations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_invitations_profile_id_idx" ON "platform"."tenant_invitations" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_users_tenant_id_user_id_unique" ON "platform"."tenant_users" USING btree ("tenant_id","profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_slug_unique" ON "platform"."tenants" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_user_id_unique" ON "platform"."user_profiles" USING btree ("user_id");