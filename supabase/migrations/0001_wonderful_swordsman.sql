CREATE SCHEMA "product";
--> statement-breakpoint
CREATE TABLE "product"."items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."tenant_invitations" ALTER COLUMN "profile_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "platform"."tenant_invitations" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "platform"."tenant_invitations" ALTER COLUMN "status" SET DATA TYPE "platform"."invitation_status" USING "status"::text::"platform"."invitation_status";--> statement-breakpoint
ALTER TABLE "platform"."tenant_invitations" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "platform"."tenant_invitations" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product"."items" ADD CONSTRAINT "items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;