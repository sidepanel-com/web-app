"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  MailIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  TrashIcon,
  ClockIcon,
  UserPlusIcon,
} from "lucide-react";
import { Button } from "@/ui-primitives/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui-primitives/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui-primitives/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui-primitives/ui/dropdown-menu";
import { Badge } from "@/ui-primitives/ui/badge";
import { Alert, AlertDescription } from "@/ui-primitives/ui/alert";
import { AlertCircle } from "lucide-react";
import { useClientTenantSDK } from "@/lib/contexts/client-tenant-sdk.context";
import { InvitationWithDetails } from "@/spaces/platform/client-sdk/tenant-invitations.client-api";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  owner:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  admin: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  member: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
};

const statusColors: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
  expired: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
};

export function InvitationsList() {
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const {
    tenantSdk,
    tenant,
    listInvitations,
    resendInvitation,
    cancelInvitation,
  } = useClientTenantSDK();

  const loadInvitations = useCallback(() => {
    if (tenant?.id) {
      listInvitations().then((result) => {
        setInvitations(result?.data?.invitations || []);
      });
    }
  }, [listInvitations, tenant?.id]);

  useEffect(() => {
    if (tenant?.id) {
      loadInvitations();
    }
  }, [loadInvitations, tenant?.id]);

  const handleResendInvitation = async (
    invitationId: string,
    email: string,
  ) => {
    try {
      setActionLoading(invitationId);
      await resendInvitation(invitationId);
      toast.success(`A new invitation has been sent to ${email}`);
      await loadInvitations();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to resend invitation",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvitation = async (
    invitationId: string,
    email: string,
  ) => {
    try {
      setActionLoading(invitationId);
      await cancelInvitation(invitationId);
      toast.success(`The invitation for ${email} has been cancelled`);
      await loadInvitations();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel invitation",
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCwIcon className="h-6 w-6 animate-spin mr-2" />
            Loading invitations...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <UserPlusIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No pending invitations</h3>
            <p className="text-muted-foreground">
              All team invitations have been accepted or expired.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailIcon className="h-5 w-5" />
          Pending Invitations ({invitations.length})
        </CardTitle>
        <CardDescription>
          Manage invitations that haven&apos;t been accepted yet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>
                  <div className="font-medium">{invitation.email}</div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={roleColors[invitation.role]}
                  >
                    {invitation.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={statusColors[invitation.status]}
                  >
                    {invitation.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {invitation.invited_by_user?.first_name ||
                      invitation.invited_by_user?.last_name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {format(
                      new Date(invitation.created_at || ""),
                      "MMM d, yyyy",
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ClockIcon className="h-3 w-3" />
                    {format(
                      new Date(invitation.expires_at || ""),
                      "MMM d, yyyy",
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoading === invitation.id}
                      >
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleResendInvitation(
                            invitation.id,
                            invitation.email,
                          )
                        }
                        disabled={invitation.status === "expired"}
                      >
                        <RefreshCwIcon className="h-4 w-4 mr-2" />
                        Resend Invitation
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleCancelInvitation(
                            invitation.id,
                            invitation.email,
                          )
                        }
                        className="text-destructive"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Cancel Invitation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
