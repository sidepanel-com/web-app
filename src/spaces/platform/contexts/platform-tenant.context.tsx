"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePlatformUser } from "@/spaces/platform/contexts/platform-user.context";

import type { Tenant } from "@db/platform/types";

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function PlatformTenantProvider({
  tenantSlug,
  children,
}: {
  tenantSlug: string;
  children: React.ReactNode;
}) {
  const { user, isLoading: userLoading } = usePlatformUser();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (userLoading) return;

    if (!user || !tenantSlug) {
      setTenant(null);
      setIsLoading(false);
      return;
    }

    async function loadTenant() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/tenants/${tenantSlug}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to load tenant");
        }

        const data = await res.json();
        if (!cancelled) {
          setTenant(data.data);
        }
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadTenant();

    return () => {
      cancelled = true;
    };
  }, [userLoading, user, tenantSlug]);

  return (
    <TenantContext.Provider
      value={{ tenant, tenantSdk: null, isLoading, error }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function usePlatformTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error(
      "usePlatformTenant must be used within a PlatformTenantProvider",
    );
  }
  return ctx;
}
