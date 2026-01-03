"use client";

import { usePlatformUser } from "@/spaces/platform/contexts/platform-user.context";

import { TenantCreateForm } from "../tenant/tenant-create-form";
import { Loading } from "@/spaces/branding/ui/loading";
import { TenantSelector } from "../tenant/tenant-selector";
import { LogoutButton } from "@/spaces/identity/ui/button-logout";

export function NoTenantSelected() {
  const {
    availableTenants,
    tenantsLoading,
    isLoading: userLoading,
  } = usePlatformUser();

  const isLoading = tenantsLoading || userLoading;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md flex flex-col gap-4">
        {isLoading ? <Loading /> : null}
        {!isLoading && availableTenants.length < 1 ? (
          <TenantCreateForm />
        ) : null}
        {!isLoading && availableTenants.length > 0 ? <TenantSelector /> : null}
        <div className="flex justify-end">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
