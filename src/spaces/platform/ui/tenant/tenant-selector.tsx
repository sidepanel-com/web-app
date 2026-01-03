"use client";

import { useState, useEffect } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui-primitives/ui/select";
import { usePlatformUser } from "@/spaces/platform/contexts/platform-user.context";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import { navigateToTenantDashboard } from "@/spaces/platform/ui/nav-helpers";
import { cn } from "@/ui-primitives/utils";

import type { Tenant } from "@db/platform/types";

interface TenantSelectorProps {
  placeholder?: string;
  className?: string;
}

export function TenantSelector({
  placeholder = "Select a tenant...",
  className,
}: TenantSelectorProps) {
  const { availableTenants, isLoading } = usePlatformUser();
  const { tenant } = usePlatformTenant();
  const [selectedValue, setSelectedValue] = useState<string>("");

  useEffect(() => {
    if (tenant?.slug) {
      setSelectedValue(tenant.slug);
    }
  }, [tenant]);

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    navigateToTenantDashboard(value);
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={cn(className, "w-full")}>
          <SelectValue placeholder="Loading tenants..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger className={cn(className, "w-full")}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {availableTenants.length === 0 ? (
          <SelectItem value="no-tenants" disabled>
            No tenants available
          </SelectItem>
        ) : (
          availableTenants.map((tenantOption: Tenant) => (
            <SelectItem key={tenantOption.id} value={tenantOption.slug}>
              {tenantOption.name} hello
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
