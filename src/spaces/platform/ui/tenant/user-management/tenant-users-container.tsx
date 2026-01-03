"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/ui-primitives/ui/button";
import { MailIcon } from "lucide-react";

import { TenantUsersList } from "./tenant-users-list";
import { InviteUserDialog } from "./invite-user-dialog";
import { EditUserRoleDialog } from "./edit-user-role-dialog";
import { RemoveUserDialog } from "./remove-user-dialog";
import {
  TenantUserListItem,
  TenantUserStats,
} from "@/lib/client-sdk/tenant-users.client-api";
import { useClientTenantSDK } from "@/lib/contexts/client-tenant-sdk.context";
import { useClientUserSDK } from "@/lib/contexts/client-user-sdk.context";

import { toast } from "sonner";
import { useTenantUsers } from "@/hooks/use-tenant-users";

export function TenantUsersContainer() {
  const { tenantSdk, tenant } = useClientTenantSDK();
  const { loadAvailableTenants } = useClientUserSDK();
  const {
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
  } = useTenantUsers();

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [removeUserDialogOpen, setRemoveUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUserListItem | null>(
    null,
  );

  useEffect(() => {
    if (tenant) {
      loadUsers();
    }
    console.log("loading users... effect called", tenant);
  }, [loadUsers, tenant]);

  const handleInviteUser = () => {
    setInviteDialogOpen(true);
  };

  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setEditUserDialogOpen(true);
    }
  };

  const handleRemoveUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setRemoveUserDialogOpen(true);
    }
  };

  const handleResendInvitation = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      // Note: This would need to be implemented in the API
      // For now, we'll show a toast
      toast.success(`A new invitation has been sent to ${user.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleInviteSuccess = () => {
    setInviteDialogOpen(false);
    loadUsers();
  };

  const handleEditSuccess = () => {
    setEditUserDialogOpen(false);
    setSelectedUser(null);
    loadUsers();
  };

  const handleRemoveSuccess = async (userId: string) => {
    try {
      await tenantSdk?.tenantUsers.removeUser(userId);
      toast.success("The user has been successfully removed from the team");
      setRemoveUserDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      throw err; // Let the dialog handle the error
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Members</h2>
          <p className="text-muted-foreground">
            Manage your team members and their permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.pending > 0 && (
            <Button variant="outline" asChild>
              <Link href={`/${tenant?.slug}/settings/users/invitations`}>
                <MailIcon className="h-4 w-4 mr-2" />
                View Invitations ({stats.pending})
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Users List */}
      <TenantUsersList
        users={users}
        stats={stats}
        isLoading={loading}
        error={error}
        onInviteUser={handleInviteUser}
        onEditUser={handleEditUser}
        onRemoveUser={handleRemoveUser}
        onResendInvitation={handleResendInvitation}
        currentUserRole="admin" // TODO: Get from context/session
      />

      {/* Dialogs */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInviteUser={async (data) => {
          console.log(data);
        }}
      />
      {/*
      <EditUserRoleDialog
        open={editUserDialogOpen}
        onOpenChange={setEditUserDialogOpen}
        user={selectedUser}
        tenantSlug={tenantSlug}
        onSuccess={handleEditSuccess}
      />

      <RemoveUserDialog
        open={removeUserDialogOpen}
        onOpenChange={setRemoveUserDialogOpen}
        user={selectedUser}
        onRemoveUser={handleRemoveSuccess}
      /> */}
    </div>
  );
}
