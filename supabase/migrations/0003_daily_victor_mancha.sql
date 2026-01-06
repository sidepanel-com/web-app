ALTER TABLE "product"."comms" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."comm_type";--> statement-breakpoint
CREATE TYPE "public"."comm_type" AS ENUM('email', 'phone', 'linkedin', 'slack', 'whatsapp', 'other');--> statement-breakpoint
ALTER TABLE "product"."comms" ALTER COLUMN "type" SET DATA TYPE "public"."comm_type" USING "type"::"public"."comm_type";--> statement-breakpoint
ALTER TABLE "product"."comms" ADD COLUMN "canonical_value" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "comms_tenant_type_canonical_value_unique" ON "product"."comms" USING btree ("tenant_id","type","canonical_value");