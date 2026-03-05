import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  OrgUnitMember,
  OrgUnitWithMemberCount,
} from "@/spaces/permissions/server/org-unit.service";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";

export function useOrgUnits() {
  const { tenant, tenantSdk, isLoading: isTenantLoading } = usePlatformTenant();
  const [orgUnits, setOrgUnits] = useState<OrgUnitWithMemberCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const basePath = `/tenants/${tenant?.slug}/org-units`;

  const loadOrgUnits = useCallback(async () => {
    if (!tenantSdk || !tenant) return;
    try {
      setLoading(true);
      setError(null);
      const response = await tenantSdk.get<{
        orgUnits: OrgUnitWithMemberCount[];
      }>(basePath);
      setOrgUnits(response?.data?.orgUnits || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load org units";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [tenantSdk, tenant, basePath]);

  const createOrgUnit = useCallback(
    async (name: string, parentOrgUnitId?: string | null) => {
      if (!tenantSdk || !tenant) return;
      try {
        setLoading(true);
        await tenantSdk.post(basePath, { name, parentOrgUnitId });
        toast.success("Org unit created");
        await loadOrgUnits();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create org unit";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tenantSdk, tenant, basePath, loadOrgUnits],
  );

  const updateOrgUnit = useCallback(
    async (
      orgUnitId: string,
      data: { name?: string; parentOrgUnitId?: string | null },
    ) => {
      if (!tenantSdk || !tenant) return;
      try {
        setLoading(true);
        await tenantSdk.patch(`${basePath}/${orgUnitId}`, data);
        toast.success("Org unit updated");
        await loadOrgUnits();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update org unit";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tenantSdk, tenant, basePath, loadOrgUnits],
  );

  const deleteOrgUnit = useCallback(
    async (orgUnitId: string) => {
      if (!tenantSdk || !tenant) return;
      try {
        setLoading(true);
        await tenantSdk.delete(`${basePath}/${orgUnitId}`);
        toast.success("Org unit deleted");
        await loadOrgUnits();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete org unit";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tenantSdk, tenant, basePath, loadOrgUnits],
  );

  const loadOrgUnitMembers = useCallback(
    async (orgUnitId: string): Promise<OrgUnitMember[]> => {
      if (!tenantSdk || !tenant) return [];
      try {
        const response = await tenantSdk.get<{ members: OrgUnitMember[] }>(
          `${basePath}/${orgUnitId}/members`,
        );
        return response?.data?.members || [];
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load members";
        toast.error(message);
        return [];
      }
    },
    [tenantSdk, tenant, basePath],
  );

  const assignMember = useCallback(
    async (orgUnitId: string, memberProfileId: string) => {
      if (!tenantSdk || !tenant) return;
      try {
        await tenantSdk.post(`${basePath}/${orgUnitId}/members`, {
          memberProfileId,
        });
        toast.success("Member assigned");
        await loadOrgUnits();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to assign member";
        toast.error(message);
        throw err;
      }
    },
    [tenantSdk, tenant, basePath, loadOrgUnits],
  );

  const removeMember = useCallback(
    async (orgUnitId: string, memberProfileId: string) => {
      if (!tenantSdk || !tenant) return;
      try {
        await tenantSdk.delete(`${basePath}/${orgUnitId}/members`, {
          data: { memberProfileId },
        });
        toast.success("Member removed");
        await loadOrgUnits();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to remove member";
        toast.error(message);
        throw err;
      }
    },
    [tenantSdk, tenant, basePath, loadOrgUnits],
  );

  return {
    orgUnits,
    loading: loading || isTenantLoading,
    error,
    loadOrgUnits,
    createOrgUnit,
    updateOrgUnit,
    deleteOrgUnit,
    loadOrgUnitMembers,
    assignMember,
    removeMember,
  };
}
