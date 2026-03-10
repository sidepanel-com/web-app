CREATE TABLE "packages"."workspace_company_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"owner_member_profile_id" uuid,
	"owner_org_unit_id" uuid,
	"status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages"."workspace_person_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"owner_member_profile_id" uuid,
	"owner_org_unit_id" uuid,
	"status" text,
	"is_vip" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "packages"."workspace_company_profiles" ADD CONSTRAINT "workspace_company_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages"."workspace_company_profiles" ADD CONSTRAINT "workspace_company_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "ledger"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages"."workspace_company_profiles" ADD CONSTRAINT "workspace_company_profiles_owner_member_fkey" FOREIGN KEY ("owner_member_profile_id") REFERENCES "permissions"."member_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages"."workspace_company_profiles" ADD CONSTRAINT "workspace_company_profiles_owner_org_fkey" FOREIGN KEY ("owner_org_unit_id") REFERENCES "permissions"."org_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages"."workspace_person_profiles" ADD CONSTRAINT "workspace_person_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages"."workspace_person_profiles" ADD CONSTRAINT "workspace_person_profiles_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "ledger"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages"."workspace_person_profiles" ADD CONSTRAINT "workspace_person_profiles_owner_member_fkey" FOREIGN KEY ("owner_member_profile_id") REFERENCES "permissions"."member_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages"."workspace_person_profiles" ADD CONSTRAINT "workspace_person_profiles_owner_org_fkey" FOREIGN KEY ("owner_org_unit_id") REFERENCES "permissions"."org_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_company_profiles_tenant_id_idx" ON "packages"."workspace_company_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_company_profiles_tenant_company_unique" ON "packages"."workspace_company_profiles" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "workspace_person_profiles_tenant_id_idx" ON "packages"."workspace_person_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_person_profiles_tenant_person_unique" ON "packages"."workspace_person_profiles" USING btree ("tenant_id","person_id");