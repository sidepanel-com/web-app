"use client";

import { useEffect } from "react";
import { Button } from "@/ui-primitives/ui/button";
import { Badge } from "@/ui-primitives/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui-primitives/ui/table";
import { UserPlus, Loader2 } from "lucide-react";
import { useMemberProfiles } from "@/spaces/packages/workspace/hooks/use-member-profiles";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";

export function MembersView() {
  const { tenant } = usePlatformTenant();
  const { members, loading, error, loadMembers, createProfile } =
    useMemberProfiles();

  useEffect(() => {
    if (tenant) {
      loadMembers();
    }
  }, [tenant, loadMembers]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Members</h2>
        <p className="text-muted-foreground">
          View member profiles and manage their org unit assignments. Create a
          member profile for a team user to enable assignment and scope
          resolution.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Member Profile</TableHead>
              <TableHead>Tenant User ID</TableHead>
              <TableHead className="w-[140px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.tenantUserId}>
                  <TableCell className="font-medium">
                    {member.displayName || "—"}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.hasMemberProfile ? (
                      <div className="space-y-1">
                        <Badge variant="secondary">Active</Badge>
                        <p
                          className="text-xs text-muted-foreground font-mono"
                          title={member.memberProfileId ?? undefined}
                        >
                          {member.memberProfileId?.slice(0, 8)}...
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        None
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-xs text-muted-foreground font-mono"
                      title={member.tenantUserId}
                    >
                      {member.tenantUserId.slice(0, 8)}...
                    </span>
                  </TableCell>
                  <TableCell>
                    {!member.hasMemberProfile && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => createProfile(member.tenantUserId)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Create
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
