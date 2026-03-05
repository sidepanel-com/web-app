"use client";

import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";

export function useEnabledPackages() {
  const { enabledPackageIds } = usePlatformTenant();
  return enabledPackageIds;
}
