
import { useState, useCallback } from "react";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import {
  TenantUserListItem,
  TenantUserStats,
} from "@/spaces/platform/client-sdk/tenant-users.client-api";
import { toast } from "sonner";

export function useTenantUsers() {
  const { tenantSdk, isLoading: isTenantLoading } = usePlatformTenant();
  const [users, setUsers] = useState<TenantUserListItem[]>([]);
  const [stats, setStats] = useState<TenantUserStats>({
    total: 0,
    active: 0,
    pending: 0,
    byRole: { owner: 0, admin: 0, member: 0, viewer: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!tenantSdk) return;
    try {
      setLoading(true);
      setError(null);
      const response = await tenantSdk.tenantUsers.listUsers();
      setUsers(response?.data?.users || [   ]);
      setStats(response?.data?.stats || { total: 0, active: 0, pending: 0, byRole: { owner: 0, admin: 0, member: 0, viewer: 0 } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [tenantSdk]);

  const inviteUser = useCallback(
    async (email: string, role: any, message?: string) => {
      if (!tenantSdk) return;
      try {
        setLoading(true);
        await tenantSdk.tenantUsers.inviteUser({ email, role, message });
        toast.success(`Invitation sent to ${email}`);
        await loadUsers();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to invite user";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tenantSdk, loadUsers],
  );

  const updateUserRole = useCallback(
    async (userId: string, role: any) => {
      if (!tenantSdk) return;
      try {
        setLoading(true);
        await tenantSdk.tenantUsers.updateUser(userId, { role });
        toast.success("User role updated");
        await loadUsers();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update user role";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [tenantSdk, loadUsers],
  );

  const updateUserStatus = useCallback(
    async (userId: string, status: any) => {
      if (!tenantSdk) return;
      try {
        setLoading(true);
        await tenantSdk.tenantUsers.updateUser(userId, { status });
        toast.success("User status updated");
        await loadUsers();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update user status";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [tenantSdk, loadUsers],
  );

  const removeUser = useCallback(
    async (userId: string) => {
      if (!tenantSdk) return;
      try {
        setLoading(true);
        await tenantSdk.tenantUsers.removeUser(userId);
        toast.success("User removed");
        await loadUsers();
      } catch (err) {
         const message = err instanceof Error ? err.message : "Failed to remove user";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [tenantSdk, loadUsers],
  );

  const resendInvitation = useCallback(
    async (invitationId: string) => {
      if (!tenantSdk) return;
      try {
        setLoading(true);
        await tenantSdk.tenantInvitations.resendInvitation(invitationId);
        toast.success("Invitation resent successfully");
        await loadUsers();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to resend invitation";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [tenantSdk, loadUsers],
  );

  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      if (!tenantSdk) return;
      try {
        setLoading(true);
        await tenantSdk.tenantInvitations.cancelInvitation(invitationId);
        toast.success("Invitation cancelled");
        await loadUsers();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to cancel invitation";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [tenantSdk, loadUsers],
  );

  return {
    users,
    stats,
    loading: loading || isTenantLoading,
    error,
    loadUsers,
    inviteUser,
    updateUserRole,
    updateUserStatus,
    removeUser,
    resendInvitation,
    cancelInvitation,
  };
}
