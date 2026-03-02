"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import { toast } from "sonner";

export type ApiKeyEntry = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

export type CreatedKey = {
  id: string;
  name: string;
  keyPrefix: string;
  key: string;
  scopes: string[];
  expiresAt: string | null;
  createdAt: string;
};

export function useApiKeys() {
  const { tenant } = usePlatformTenant();
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const loadKeys = useCallback(async () => {
    if (!tenant?.slug) return;
    setLoading(true);
    setForbidden(false);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/api-keys`, {
        credentials: "include",
      });
      if (res.status === 403) {
        setForbidden(true);
        setKeys([]);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to load API keys");
      }
      const data = await res.json();
      setKeys(data.data?.keys ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load API keys",
      );
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, [tenant?.slug]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const createKey = useCallback(
    async (
      name: string,
      scopes: string[],
    ): Promise<CreatedKey | null> => {
      if (!tenant?.slug) return null;
      try {
        const res = await fetch(`/api/tenants/${tenant.slug}/api-keys`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, scopes }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? "Failed to create API key");
        }
        const data = await res.json();
        const keyPayload: CreatedKey | undefined = data.data?.key;
        if (keyPayload) {
          loadKeys();
          return keyPayload;
        }
        return null;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to create API key",
        );
        return null;
      }
    },
    [tenant?.slug, loadKeys],
  );

  const revokeKey = useCallback(
    async (keyId: string): Promise<boolean> => {
      if (!tenant?.slug) return false;
      try {
        const res = await fetch(
          `/api/tenants/${tenant.slug}/api-keys/${keyId}`,
          { method: "DELETE", credentials: "include" },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? "Failed to revoke API key");
        }
        loadKeys();
        toast.success("API key revoked");
        return true;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to revoke API key",
        );
        return false;
      }
    },
    [tenant?.slug, loadKeys],
  );

  return { keys, loading, forbidden, createKey, revokeKey, reload: loadKeys };
}
