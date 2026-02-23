"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/spaces/identity/identity-auth.context";
import { createUserClientSDK } from "@/spaces/platform/client-sdk";

import type { Tenant } from "@db/platform/types";
import type { UserClientSDK } from "@/spaces/platform/client-sdk";
import { navigateToTenantDashboard } from "../ui/nav-helpers";

interface PlatformUser {
  id: string;
  email: string;
  displayName?: string;
  timezone?: string;
}

interface UserContextType {
  user: PlatformUser | null;
  isLoading: boolean;
  error: Error | null;
  // Tenant selection functionality
  availableTenants: Tenant[];
  createTenantError: Error | null;
  loadAvailableTenants: () => Promise<void>;
  createTenant: (tenantName: string, redirect?: boolean) => Promise<void>;
  tenantsLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function PlatformUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading: authLoading } = useAuth();

  const [userSdk, setUserSdk] = useState<UserClientSDK | null>(null);
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // User Tenants state
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [createTenantError, setCreateTenantError] = useState<Error | null>(
    null,
  );

  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const token = session?.access_token ?? null;
    if (token === lastTokenRef.current) return;
    lastTokenRef.current = token;

    if (!token) {
      setUserSdk(null);
      setAvailableTenants([]);
      setUser(null);
      setIsLoading(false);
      return;
    }

    const _userSdk = createUserClientSDK({
      baseUrl: process.env.NEXT_PUBLIC_API_URL || "",
      accessToken: token,
    });
    setUserSdk(_userSdk);

    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email || "",
        displayName:
          session.user.user_metadata?.full_name || session.user.email,
      });
    }

    setError(null);
    setIsLoading(false);
  }, [session]);

  // Load available tenants when SDK is ready
  const loadAvailableTenants = useCallback(async () => {
    setTenantsLoading(true);
    if (!userSdk) {
      setTenantsLoading(false);
      return;
    }

    try {
      const response = await userSdk.userTenants.getTenants();
      if (response?.error) {
        setError(new Error(response.error));
      } else {
        setAvailableTenants([...(response?.data || [])]);
        setError(null);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setTenantsLoading(false);
    }
  }, [userSdk]);

  useEffect(() => {
    if (userSdk) {
      loadAvailableTenants();
    }
  }, [userSdk, loadAvailableTenants]);

  const createTenant = async (
    tenantName: string,
    redirect: boolean = false,
  ) => {
    if (!userSdk) throw new Error("User SDK not available");

    try {
      setIsLoading(true);
      setCreateTenantError(null);

      const response = await userSdk.userTenants.createTenant(tenantName);

      if (response.error) {
        throw new Error(response.error);
      }

      const newTenant = response.data;
      if (!newTenant?.slug) {
        throw new Error("Tenant did not return a slug");
      }

      if (redirect) {
        return navigateToTenantDashboard(newTenant.slug);
      }

      await loadAvailableTenants();
    } catch (err) {
      setCreateTenantError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        error,
        availableTenants,
        createTenantError,
        loadAvailableTenants,
        createTenant,
        tenantsLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function usePlatformUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
