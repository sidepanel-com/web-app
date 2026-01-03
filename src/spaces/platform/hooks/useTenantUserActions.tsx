import { useState, useEffect, useCallback } from "react";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import {
  TenantUserListItem,
  TenantUserStats,
} from "@/spaces/platform/client-sdk/tenant-users.client-api";
import { Enums } from "@/types/database.types";

type UserRole = Enums<"user_role">;
type UserStatus = Enums<"user_status">;

export function useTenantUsers() {
  const { tenantSdk, tenant } = usePlatformTenant();

  const [users, setUsers] = useState<TenantUserListItem[]>([]);
  const [stats, setStats] = useState<TenantUserStats>({
    total: 0,
    active: 0,
    pending: 0,
    byRole: {
      owner: 0,
      admin: 0,
      member: 0,
      viewer: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!tenantSdk) return;

    try {
      setLoading(true);
      setError(null);
      const result = await tenantSdk.tenantUsers.listUsers();
      setUsers(result?.data?.users || []);
      setStats(
        result?.data?.stats || {
          total: 0,
          active: 0,
          pending: 0,
          byRole: {
            owner: 0,
            admin: 0,
            member: 0,
            viewer: 0,
          },
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [tenantSdk]);

  const inviteUser = useCallback(
    async (email: string, role: UserRole) => {
      if (!tenantSdk) throw new Error("Tenant SDK not initialized");

      const result = await tenantSdk.tenantUsers.inviteUser({
        email,
        role,
      });
      await loadUsers(); // Refresh the list
      return result;
    },
    [tenantSdk, loadUsers],
  );

  const updateUserRole = useCallback(
    async (userId: string, role: UserRole) => {
      if (!tenantSdk) throw new Error("Tenant SDK not initialized");

      const result = await tenantSdk.tenantUsers.updateUserRole(userId, role);
      await loadUsers(); // Refresh the list
      return result;
    },
    [tenantSdk, loadUsers],
  );

  const updateUserStatus = useCallback(
    async (userId: string, status: UserStatus) => {
      if (!tenantSdk) throw new Error("Tenant SDK not initialized");

      const result = await tenantSdk.tenantUsers.updateUserStatus(
        userId,
        status,
      );
      await loadUsers(); // Refresh the list
      return result;
    },
    [tenantSdk, loadUsers],
  );

  const removeUser = useCallback(
    async (userId: string) => {
      if (!tenantSdk) throw new Error("Tenant SDK not initialized");

      const result = await tenantSdk.tenantUsers.removeUser(userId);
      await loadUsers(); // Refresh the list
      return result;
    },
    [tenantSdk, loadUsers],
  );

  const resendInvitation = useCallback(
    async (invitationId: string) => {
      if (!tenantSdk) throw new Error("Tenant SDK not initialized");

      const result =
        await tenantSdk.tenantInvitations.resendInvitation(invitationId);
      await loadUsers(); // Refresh the list
      return result;
    },
    [tenantSdk, loadUsers],
  );

  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      if (!tenantSdk) throw new Error("Tenant SDK not initialized");

      const result =
        await tenantSdk.tenantInvitations.cancelInvitation(invitationId);
      await loadUsers(); // Refresh the list
      return result;
    },
    [tenantSdk, loadUsers],
  );

  useEffect(() => {
    if (tenant) {
      loadUsers();
    }
  }, [tenant, loadUsers]);

  return {
    users,
    stats,
    loading,
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
