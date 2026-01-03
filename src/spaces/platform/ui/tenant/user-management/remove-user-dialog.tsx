"use client";

import * as React from "react";
import { useState } from "react";
import { TrashIcon, AlertTriangleIcon } from "lucide-react";
import { Button } from "@/ui-primitives/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui-primitives/ui/dialog";
import { Alert, AlertDescription } from "@/ui-primitives/ui/alert";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/ui-primitives/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui-primitives/ui/avatar";
import { TenantUserListItem } from "@/spaces/platform/client-sdk/tenant-users.client-api";

interface RemoveUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TenantUserListItem | null;
  onRemoveUser: (userId: string) => Promise<void>;
  isLoading?: boolean;
}

function getUserInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string,
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName[0].toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "U";
}

function getUserDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string,
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  return email || "Unknown User";
}

const roleColors: Record<string, string> = {
  owner:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  admin: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  member: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
};

export function RemoveUserDialog({
  open,
  onOpenChange,
  user,
  onRemoveUser,
  isLoading = false,
}: RemoveUserDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    if (!user) return;

    try {
      setError(null);
      await onRemoveUser(user.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove user");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
    }
    onOpenChange(newOpen);
  };

  if (!user) return null;

  const displayName = getUserDisplayName(
    user.first_name,
    user.last_name,
    user.email,
  );

  const isPending = user.status === "pending";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TrashIcon className="h-5 w-5" />
            {isPending ? "Cancel Invitation" : "Remove Team Member"}
          </DialogTitle>
          <DialogDescription>
            {isPending
              ? "This will cancel the pending invitation. The user will not be able to join the team using the previously sent link."
              : "This action cannot be undone. The user will lose access to this tenant immediately."}
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <div className="flex items-center space-x-4 rounded-lg border p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>
              {getUserInitials(user.first_name, user.last_name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">{displayName}</div>
            {user.email && (
              <div className="text-sm text-muted-foreground">{user.email}</div>
            )}
            <div className="mt-2">
              <Badge variant="secondary" className={roleColors[user.role]}>
                {user.role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Warning */}
        {!isPending && (
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Removing {displayName} will:
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                <li>Immediately revoke their access to this tenant</li>
                <li>
                  Remove them from all tenant-specific content and settings
                </li>
                <li>Cancel any pending invitations they may have sent</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isLoading}
          >
            {isLoading
              ? isPending
                ? "Cancelling..."
                : "Removing..."
              : isPending
                ? "Cancel Invitation"
                : "Remove User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
