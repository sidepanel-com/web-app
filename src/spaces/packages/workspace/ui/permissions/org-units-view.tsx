"use client";

import {
  Building2,
  ChevronDown,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMemberProfiles } from "@/spaces/packages/workspace/hooks/use-member-profiles";
import { useOrgUnits } from "@/spaces/packages/workspace/hooks/use-org-units";
import type {
  OrgUnitMember,
  OrgUnitWithMemberCount,
} from "@/spaces/packages/workspace/server/org-unit.service";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui-primitives/ui/alert-dialog";
import { Badge } from "@/ui-primitives/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui-primitives/ui/dropdown-menu";
import { Input } from "@/ui-primitives/ui/input";
import { Label } from "@/ui-primitives/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui-primitives/ui/select";

interface TreeNode extends OrgUnitWithMemberCount {
  children: TreeNode[];
  depth: number;
}

function buildTree(units: OrgUnitWithMemberCount[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const unit of units) {
    map.set(unit.id, { ...unit, children: [], depth: 0 });
  }

  for (const node of map.values()) {
    const parent = node.parentOrgUnitId
      ? map.get(node.parentOrgUnitId)
      : undefined;
    if (parent) {
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  function setDepths(nodes: TreeNode[], depth: number) {
    for (const n of nodes) {
      n.depth = depth;
      setDepths(n.children, depth + 1);
    }
  }
  setDepths(roots, 0);

  return roots;
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  for (const node of nodes) {
    result.push(node);
    result.push(...flattenTree(node.children));
  }
  return result;
}

function hasChildren(unitId: string, units: OrgUnitWithMemberCount[]): boolean {
  return units.some((u) => u.parentOrgUnitId === unitId);
}

export function OrgUnitsView() {
  const { tenant } = usePlatformTenant();
  const {
    orgUnits,
    loading,
    error,
    loadOrgUnits,
    createOrgUnit,
    updateOrgUnit,
    deleteOrgUnit,
    loadOrgUnitMembers,
    assignMember,
    removeMember,
  } = useOrgUnits();

  const { members: allMembers, loadMembers } = useMemberProfiles();

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createParentId, setCreateParentId] = useState<string | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [membersOpen, setMembersOpen] = useState(false);
  const [membersUnitId, setMembersUnitId] = useState<string | null>(null);
  const [unitMembers, setUnitMembers] = useState<OrgUnitMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tenant) {
      loadOrgUnits();
    }
  }, [tenant, loadOrgUnits]);

  const tree = useMemo(() => buildTree(orgUnits), [orgUnits]);
  const flatNodes = useMemo(() => flattenTree(tree), [tree]);

  const visibleNodes = useMemo(() => {
    const hidden = new Set<string>();
    for (const node of flatNodes) {
      if (node.parentOrgUnitId && hidden.has(node.parentOrgUnitId)) {
        hidden.add(node.id);
        continue;
      }
      if (node.parentOrgUnitId && collapsed.has(node.parentOrgUnitId)) {
        hidden.add(node.id);
      }
    }
    return flatNodes.filter((n) => !hidden.has(n.id));
  }, [flatNodes, collapsed]);

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    try {
      await createOrgUnit(createName.trim(), createParentId);
      setCreateOpen(false);
      setCreateName("");
      setCreateParentId(null);
    } catch {
      // toast handled by hook
    }
  };

  const handleRename = async () => {
    if (!renameId || !renameName.trim()) return;
    try {
      await updateOrgUnit(renameId, { name: renameName.trim() });
      setRenameOpen(false);
      setRenameId(null);
      setRenameName("");
    } catch {
      // toast handled by hook
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOrgUnit(deleteId);
      setDeleteOpen(false);
      setDeleteId(null);
    } catch {
      // toast handled by hook
    }
  };

  const openRename = (unit: OrgUnitWithMemberCount) => {
    setRenameId(unit.id);
    setRenameName(unit.name);
    setRenameOpen(true);
  };

  const openDelete = (unit: OrgUnitWithMemberCount) => {
    setDeleteId(unit.id);
    setDeleteOpen(true);
  };

  const openMembers = useCallback(
    async (unit: OrgUnitWithMemberCount) => {
      setMembersUnitId(unit.id);
      setMembersOpen(true);
      setMembersLoading(true);
      if (allMembers.length === 0) {
        loadMembers();
      }
      const members = await loadOrgUnitMembers(unit.id);
      setUnitMembers(members);
      setMembersLoading(false);
    },
    [loadOrgUnitMembers, loadMembers, allMembers.length],
  );

  const refreshUnitMembers = useCallback(async () => {
    if (!membersUnitId) return;
    const members = await loadOrgUnitMembers(membersUnitId);
    setUnitMembers(members);
  }, [membersUnitId, loadOrgUnitMembers]);

  const handleAssignMember = async (memberProfileId: string) => {
    if (!membersUnitId) return;
    try {
      await assignMember(membersUnitId, memberProfileId);
      await refreshUnitMembers();
    } catch {
      // toast handled by hook
    }
  };

  const handleRemoveMember = async (memberProfileId: string) => {
    if (!membersUnitId) return;
    try {
      await removeMember(membersUnitId, memberProfileId);
      await refreshUnitMembers();
    } catch {
      // toast handled by hook
    }
  };

  const assignedProfileIds = new Set(unitMembers.map((m) => m.memberProfileId));
  const availableMembers = allMembers.filter(
    (m) =>
      m.hasMemberProfile &&
      m.memberProfileId &&
      !assignedProfileIds.has(m.memberProfileId),
  );

  const membersUnit = orgUnits.find((u) => u.id === membersUnitId);

  const deleteTarget = orgUnits.find((u) => u.id === deleteId);
  const deleteHasChildren = deleteId ? hasChildren(deleteId, orgUnits) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Org Units</h2>
          <p className="text-muted-foreground">
            Manage your organizational hierarchy. Org units control how data
            visibility is scoped across your team.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Create Org Unit
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && orgUnits.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orgUnits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No org units yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Create your first org unit to start building your organizational
            structure.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          {visibleNodes.map((node) => {
            const nodeHasChildren = hasChildren(node.id, orgUnits);
            const isCollapsed = collapsed.has(node.id);

            return (
              <div
                key={node.id}
                className="flex items-center gap-2 border-b last:border-b-0 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div
                  className="flex items-center gap-1 flex-1 min-w-0"
                  style={{ paddingLeft: `${node.depth * 24}px` }}
                >
                  {nodeHasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleCollapse(node.id)}
                      className="p-0.5 rounded hover:bg-muted"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  ) : (
                    <span className="w-5" />
                  )}
                  <span className="font-medium truncate">{node.name}</span>
                </div>

                <Badge variant="secondary" className="gap-1 shrink-0">
                  <Users className="h-3 w-3" />
                  {node.memberCount}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openMembers(node)}>
                      <Users className="h-4 w-4 mr-2" />
                      Manage members
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setCreateParentId(node.id);
                        setCreateName("");
                        setCreateOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add child
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openRename(node)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openDelete(node)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Org Unit</DialogTitle>
            <DialogDescription>
              {createParentId
                ? `Creating a child unit under "${orgUnits.find((u) => u.id === createParentId)?.name}".`
                : "Create a new top-level org unit."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                placeholder="e.g. Sales, Engineering, APAC"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-parent">Parent</Label>
              <Select
                value={createParentId ?? "root"}
                onValueChange={(v) =>
                  setCreateParentId(v === "root" ? null : v)
                }
              >
                <SelectTrigger id="create-parent">
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">None (top-level)</SelectItem>
                  {orgUnits.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createName.trim() || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Org Unit</DialogTitle>
            <DialogDescription>
              Enter a new name for this org unit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rename-name">Name</Label>
            <Input
              id="rename-name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!renameName.trim() || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Org Unit</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteHasChildren ? (
                <>
                  <strong>{deleteTarget?.name}</strong> has child units. Remove
                  or move them first before deleting this unit.
                </>
              ) : (
                <>
                  Are you sure you want to delete{" "}
                  <strong>{deleteTarget?.name}</strong>? This action cannot be
                  undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteHasChildren || loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Members &mdash; {membersUnit?.name}</DialogTitle>
            <DialogDescription>
              Assign or remove member profiles from this org unit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {availableMembers.length > 0 && (
              <div className="space-y-2">
                <Label>Add member</Label>
                <Select onValueChange={(v) => handleAssignMember(v)} value="">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((m) => (
                      <SelectItem
                        key={m.memberProfileId}
                        value={m.memberProfileId ?? ""}
                      >
                        {m.displayName || m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label>Assigned ({unitMembers.length})</Label>
              {membersLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : unitMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No members assigned yet.
                </p>
              ) : (
                <div className="rounded-md border divide-y">
                  {unitMembers.map((m) => (
                    <div
                      key={m.memberProfileId}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {m.displayName || m.email}
                        </p>
                        {m.displayName && (
                          <p className="text-xs text-muted-foreground truncate">
                            {m.email}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveMember(m.memberProfileId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
