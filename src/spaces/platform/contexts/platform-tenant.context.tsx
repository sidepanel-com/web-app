"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createTenantClientSDK } from "@/spaces/platform/client-sdk";
import type { TenantClientSDK } from "@/spaces/platform/client-sdk";
import type { Tenant } from "@db/platform/types";
import { useAuth } from "@/spaces/identity/identity-auth.context";
import { usePlatformUser } from "@/spaces/platform/contexts/platform-user.context";
import { saveLastTenantSlug } from "@/spaces/platform/ui/nav-helpers";

interface TenantContextType {
  tenant: Tenant | null;
  tenantSdk: TenantClientSDK | null;
  isLoading: boolean;
  error: Error | null;
  reloadTenant: () => Promise<void>;
  enabledPackageIds: string[] | null;
  reloadPackages: () => Promise<void>;
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
  const { session } = useAuth();

  const [tenantSdk, setTenantSdk] = useState<TenantClientSDK | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [enabledPackageIds, setEnabledPackageIds] = useState<string[] | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    if (userLoading) return;

    if (!user || !tenantSlug) {
      setTenant(null);
      setTenantSdk(null);
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
          saveLastTenantSlug(tenantSlug);

          if (session?.access_token) {
            const sdk = createTenantClientSDK(
              {
                baseUrl: process.env.NEXT_PUBLIC_API_URL || "",
                accessToken: session.access_token,
              },
              tenantSlug,
            );
            setTenantSdk(sdk);
          }
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
  }, [userLoading, user, tenantSlug, session?.access_token]);

  const reloadTenant = async () => {
    if (!tenantSlug) return;
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load tenant");
      const data = await res.json();
      setTenant(data.data);
    } catch (err) {
      console.error("Failed to reload tenant", err);
    }
  };

  const loadPackages = useCallback(async () => {
    if (!tenant) {
      setEnabledPackageIds(null);
      return;
    }
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/packages`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const json = await res.json();
      const ids = (json.data as { packageId: string; enabled: boolean }[])
        .filter((p) => p.enabled)
        .map((p) => p.packageId);
      setEnabledPackageIds(ids);
    } catch {
      // Silently degrade — show all nav on error
    }
  }, [tenant]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantSdk,
        isLoading,
        error,
        reloadTenant,
        enabledPackageIds,
        reloadPackages: loadPackages,
      }}
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
