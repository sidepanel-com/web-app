"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EditIcon, UserIcon } from "lucide-react";
import { Button } from "@/ui-primitives/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui-primitives/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/ui-primitives/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui-primitives/ui/select";
import { Alert, AlertDescription } from "@/ui-primitives/ui/alert";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/ui-primitives/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui-primitives/ui/avatar";
import {
  TenantUserListItem,
  UpdateUserRequest,
} from "@/lib/client-sdk/tenant-users.client-api";

type UserRole = "owner" | "admin" | "member" | "viewer";

const editUserRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member", "viewer"], {
    required_error: "Please select a role",
  }),
});

type EditUserRoleFormValues = z.infer<typeof editUserRoleSchema>;

interface EditUserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TenantUserListItem | null;
  onUpdateUser: (userId: string, data: UpdateUserRequest) => Promise<void>;
  currentUserRole?: UserRole;
  isLoading?: boolean;
}

const roleDescriptions: Record<UserRole, string> = {
  owner: "Full access to everything including billing and team management",
  admin: "Can manage users, settings, and all content",
  member: "Can create and edit content, limited admin access",
  viewer: "Can view content but cannot make changes",
};

const roleColors: Record<UserRole, string> = {
  owner:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  admin: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  member: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
};

const availableRoles: Record<UserRole, UserRole[]> = {
  owner: ["admin", "member", "viewer"],
  admin: ["member", "viewer"],
  member: [],
  viewer: [],
};

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

export function EditUserRoleDialog({
  open,
  onOpenChange,
  user,
  onUpdateUser,
  currentUserRole = "viewer",
  isLoading = false,
}: EditUserRoleDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditUserRoleFormValues>({
    resolver: zodResolver(editUserRoleSchema),
    defaultValues: {
      role: user?.role || "viewer",
    },
  });

  // Update form when user changes
  React.useEffect(() => {
    if (user) {
      form.reset({ role: user.role });
    }
  }, [user, form]);

  const allowedRoles = availableRoles[currentUserRole] || [];

  const onSubmit = async (data: EditUserRoleFormValues) => {
    if (!user) return;

    try {
      setError(null);
      await onUpdateUser(user.id, { role: data.role });
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user role",
      );
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
      if (user) {
        form.reset({ role: user.role });
      }
    }
    onOpenChange(newOpen);
  };

  if (!user) return null;

  const currentRole = form.watch("role");
  const hasChanges = currentRole !== user.role;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EditIcon className="h-5 w-5" />
            Edit User Role
          </DialogTitle>
          <DialogDescription>
            Change the role and permissions for this team member.
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
            <div className="font-medium">
              {getUserDisplayName(user.first_name, user.last_name, user.email)}
            </div>
            {user.email && (
              <div className="text-sm text-muted-foreground">{user.email}</div>
            )}
            <div className="mt-2">
              <Badge variant="secondary" className={roleColors[user.role]}>
                Current: {user.role}
              </Badge>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allowedRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex flex-col">
                            <span className="font-medium capitalize">
                              {role}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {roleDescriptions[role]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the new role for this user. This will immediately
                    change their permissions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {hasChanges && (
              <Alert>
                <UserIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Role Change:</strong> {user.role} → {currentRole}
                  <br />
                  <span className="text-sm text-muted-foreground">
                    {roleDescriptions[currentRole as UserRole]}
                  </span>
                </AlertDescription>
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
              <Button type="submit" disabled={isLoading || !hasChanges}>
                {isLoading ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
