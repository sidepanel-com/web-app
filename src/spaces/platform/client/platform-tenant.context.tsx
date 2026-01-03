"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@/spaces/platform/client/platform-user.context";

interface Tenant {
  id: string;
  name: string;
  role: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function PlatformTenantProvider({
  tenantId,
  children,
}: {
  tenantId: string;
  children: React.ReactNode;
}) {
  const { user, isLoading: userLoading } = useUser();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (userLoading) return;

    if (!user) {
      setTenant(null);
      setIsLoading(false);
      return;
    }

    async function loadTenant() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/platform/tenant", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to load tenant");
        }

        const data = await res.json();
        if (!cancelled) {
          setTenant(data);
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
  }, [userLoading, user]);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return ctx;
}
