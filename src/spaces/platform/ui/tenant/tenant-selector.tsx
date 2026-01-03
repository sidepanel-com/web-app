"use client";

import { useState } from "react";
import { Tables } from "@/types/database.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui-primitives/ui/select";
import { usePlatformUser } from "@/spaces/platform/contexts/platform-user.context";
import { navigateToTenantDashboard } from "@/spaces/platform/ui/nav-helpers";
import { cn } from "@/ui-primitives/utils";

interface TenantSelectorProps {
  placeholder?: string;
  className?: string;
}

export function TenantSelector({
  placeholder = "Select a tenant...",
  className,
}: TenantSelectorProps) {
  const { availableTenants, isLoading } = usePlatformUser();
  const [selectedValue, setSelectedValue] = useState<string>("");

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
          availableTenants.map((tenantOption: Tables<"tenants">) => (
            <SelectItem key={tenantOption.id} value={tenantOption.slug}>
              {tenantOption.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
