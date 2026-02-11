import { useState, useCallback, useEffect } from "react";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import { IntegrationListItem } from "@/spaces/platform/client-sdk/integrations.client-api";
import { IntegrationMethod, IntegrationProvider } from "@/spaces/integrations/core/types";
import { toast } from "sonner";

export function useIntegrations() {
  const { tenantSdk, isLoading: isTenantLoading } = usePlatformTenant();
  const [integrations, setIntegrations] = useState<IntegrationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadIntegrations = useCallback(async () => {
    if (!tenantSdk) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await tenantSdk.integrations.listIntegrations();
      setIntegrations(response.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load integrations";
      setError(err instanceof Error ? err : new Error(message));
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [tenantSdk]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const connectAsync = async ({ provider, method }: { provider: IntegrationProvider, method: IntegrationMethod }) => {
    if (!tenantSdk) throw new Error("Tenant SDK not initialized");
    try {
      setIsConnecting(true);
      setError(null);
      const response = await tenantSdk.integrations.connect(provider, method);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initiate connection";
      setError(err instanceof Error ? err : new Error(message));
      toast.error(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const finalizeConnection = async (data: {
    provider: IntegrationProvider;
    method: IntegrationMethod;
    providerAccountId: string;
    connectionData?: any;
  }) => {
    if (!tenantSdk) return;
    try {
      setIsLoading(true);
      await tenantSdk.integrations.finalizeConnection(data);
      toast.success("Integration connected successfully");
      await loadIntegrations();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to finalize connection";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async (provider: IntegrationProvider, method: IntegrationMethod) => {
    if (!tenantSdk) return;
    try {
      setIsDisconnecting(true);
      await tenantSdk.integrations.disconnect(provider, method);
      toast.success("Integration disconnected");
      await loadIntegrations();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect integration";
      toast.error(message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return {
    integrations,
    isLoading: isLoading || isTenantLoading,
    isConnecting,
    isDisconnecting,
    error,
    connectAsync,
    finalizeConnection,
    disconnect,
    refetch: loadIntegrations,
    sync: loadIntegrations, // Compatibility with user's POC
    handleConnectionSuccess: loadIntegrations, // Compatibility with user's POC
    connectError: error, // Compatibility with user's POC
  };
}

