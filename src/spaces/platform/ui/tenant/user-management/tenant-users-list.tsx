"use client";

import * as React from "react";
import { useState } from "react";
import {
  MoreHorizontalIcon,
  UserPlusIcon,
  MailIcon,
  TrashIcon,
  EditIcon,
} from "lucide-react";
import { Badge } from "@/ui-primitives/ui/badge";
import { Button } from "@/ui-primitives/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui-primitives/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui-primitives/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui-primitives/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui-primitives/ui/avatar";
import { Skeleton } from "@/ui-primitives/ui/skeleton";
import { Alert, AlertDescription } from "@/ui-primitives/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  TenantUserListItem,
  TenantUserStats,
} from "@/spaces/platform/client-sdk/tenant-users.client-api";
import { cn } from "@/ui-primitives/utils";

type UserRole = "owner" | "admin" | "member" | "viewer";
type UserStatus = "active" | "inactive" | "pending";

interface TenantUsersListProps {
  users: TenantUserListItem[];
  stats: TenantUserStats;
  isLoading?: boolean;
  error?: string | null;
  onInviteUser?: () => void;
  onEditUser?: (userId: string) => void;
  onRemoveUser?: (userId: string) => void;
  onResendInvitation?: (userId: string) => void;
  currentUserRole?: UserRole;
}

const roleColors: Record<UserRole, string> = {
  owner:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  admin: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  member: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
};

const statusColors: Record<UserStatus, string> = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
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

function canManageUser(
  currentUserRole: UserRole,
  targetUserRole: UserRole,
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    member: 2,
    admin: 3,
    owner: 4,
  };

  return roleHierarchy[currentUserRole] > roleHierarchy[targetUserRole];
}

function CountCard({
  count,
  title,
  className,
}: {
  count: number;
  title: string;
  className?: string;
}) {
  return (
    <Card className="p-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-0">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-1">
        <div className={cn("text-lg font-bold", className)}>{count}</div>
      </CardContent>
    </Card>
  );
}

export function TenantUsersList({
  users,
  stats,
  isLoading,
  error,
  onInviteUser,
  onEditUser,
  onRemoveUser,
  onResendInvitation,
  currentUserRole = "viewer",
}: TenantUsersListProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const canInviteUsers = ["owner", "admin"].includes(currentUserRole);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <CountCard count={stats.total} title="All" />
        <CountCard
          count={stats.active}
          title="Active"
          className="text-green-600"
        />
        <CountCard
          count={stats.pending}
          title="Pending"
          className="text-yellow-600"
        />
        <CountCard
          count={(stats.byRole.owner || 0) + (stats.byRole.admin || 0)}
          title="Admins"
          className="text-purple-600"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            A list of all team members including their roles and status.
          </CardDescription>
          <CardAction>
            {canInviteUsers && (
              <Button onClick={onInviteUser}>
                <UserPlusIcon className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {getUserInitials(
                              user.first_name,
                              user.last_name,
                              user.email,
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {getUserDisplayName(
                              user.first_name,
                              user.last_name,
                              user.email,
                            )}
                          </div>
                          {user.email && (
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={roleColors[user.role]}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.status
                            ? statusColors[user.status]
                            : statusColors.active
                        }
                      >
                        {user.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.joined_at
                        ? new Date(user.joined_at).toLocaleDateString()
                        : "Pending"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {user.status === "pending" && onResendInvitation && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onResendInvitation(user.id)}
                              >
                                <MailIcon className="mr-2 h-4 w-4" />
                                Resend Invitation
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {canManageUser(currentUserRole, user.role) && (
                            <>
                              {onEditUser && (
                                <DropdownMenuItem
                                  onClick={() => onEditUser(user.id)}
                                >
                                  <EditIcon className="mr-2 h-4 w-4" />
                                  Edit Role
                                </DropdownMenuItem>
                              )}
                              {onRemoveUser && user.role !== "owner" && (
                                <DropdownMenuItem
                                  onClick={() => onRemoveUser(user.id)}
                                  className="text-destructive"
                                >
                                  <TrashIcon className="mr-2 h-4 w-4" />
                                  Remove User
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No team members found.</p>
              {canInviteUsers && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={onInviteUser}
                >
                  <UserPlusIcon className="mr-2 h-4 w-4" />
                  Invite your first team member
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
