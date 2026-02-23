import { useState, useCallback } from "react";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import type { MemberWithStatus } from "@/spaces/packages/workspace/server/member-profile.service";
import { toast } from "sonner";

export function useMemberProfiles() {
  const { tenant, tenantSdk, isLoading: isTenantLoading } =
    usePlatformTenant();
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const basePath = `/tenants/${tenant?.slug}/member-profiles`;

  const loadMembers = useCallback(async () => {
    if (!tenantSdk || !tenant) return;
    try {
      setLoading(true);
      setError(null);
      const response = await tenantSdk.get<{ members: MemberWithStatus[] }>(
        basePath,
      );
      setMembers(response?.data?.members || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load members";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [tenantSdk, tenant, basePath]);

  const createProfile = useCallback(
    async (tenantUserId: string) => {
      if (!tenantSdk || !tenant) return;
      try {
        setLoading(true);
        await tenantSdk.post(basePath, { tenantUserId });
        toast.success("Member profile created");
        await loadMembers();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to create member profile";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tenantSdk, tenant, basePath, loadMembers],
  );

  return {
    members,
    loading: loading || isTenantLoading,
    error,
    loadMembers,
    createProfile,
  };
}
