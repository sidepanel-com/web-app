"use client";

import { useCallback, useEffect, useState } from "react";
import { Key, Plus, Trash2, Copy, Check } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui-primitives/ui/dialog";
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
import { Input } from "@/ui-primitives/ui/input";
import { Label } from "@/ui-primitives/ui/label";
import { Alert, AlertDescription } from "@/ui-primitives/ui/alert";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import { toast } from "sonner";
import { format } from "date-fns";
import { COMMS_SCOPES_FULL, COMMS_SCOPES_READ } from "@/spaces/product/server/scopes";

type ApiKeyEntry = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

type CreatedKey = {
  id: string;
  name: string;
  keyPrefix: string;
  key: string;
  scopes: string[];
  expiresAt: string | null;
  createdAt: string;
};

const SCOPE_PRESETS = [
  { label: "Full access (Comms read + write)", value: "full", scopes: COMMS_SCOPES_FULL },
  { label: "Read only (Comms)", value: "read", scopes: COMMS_SCOPES_READ },
] as const;

export function ApiKeysSettings() {
  const { tenant } = usePlatformTenant();
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createScopePreset, setCreateScopePreset] = useState<"full" | "read">("full");
  const [createLoading, setCreateLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const loadKeys = useCallback(async () => {
    if (!tenant?.slug) return;
    setLoading(true);
    setForbidden(false);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/api-keys`, {
        credentials: "include",
      });
      if (res.status === 403) {
        setForbidden(true);
        setKeys([]);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to load API keys");
      }
      const data = await res.json();
      setKeys(data.data?.keys ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load API keys");
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, [tenant?.slug]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreate = async () => {
    if (!tenant?.slug || !createName.trim()) return;
    setCreateLoading(true);
    try {
      const preset = SCOPE_PRESETS.find((p) => p.value === createScopePreset);
      const scopes = preset?.scopes ?? COMMS_SCOPES_FULL;
      const res = await fetch(`/api/tenants/${tenant.slug}/api-keys`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim(), scopes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to create API key");
      }
      const data = await res.json();
      const keyPayload = data.data?.key;
      if (keyPayload) {
        setCreatedKey(keyPayload);
        setCreateOpen(false);
        setCreateName("");
        setCreateScopePreset("full");
        loadKeys();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (!createdKey?.key) return;
    navigator.clipboard.writeText(createdKey.key);
    setCopiedKey(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRevoke = async (keyId: string) => {
    if (!tenant?.slug) return;
    setRevokeLoading(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/api-keys/${keyId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to revoke API key");
      }
      setRevokeKeyId(null);
      loadKeys();
      toast.success("API key revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke API key");
    } finally {
      setRevokeLoading(false);
    }
  };

  if (forbidden) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">API Keys</h1>
          <p className="text-muted-foreground">
            Create and manage API keys for programmatic access.
          </p>
        </div>
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            Only workspace owners can create and manage API keys. Contact your
            workspace owner to get access or create keys.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">API Keys</h1>
          <p className="text-muted-foreground">
            Create and manage API keys for programmatic access. Keys are
            tenant-scoped and can be limited by scope.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your API keys</CardTitle>
          <CardDescription>
            Keys are shown by prefix only. The full key is only shown once when
            created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No API keys yet. Create one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {k.keyPrefix}…
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {k.scopes?.length ?? 0} scope(s)
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {k.lastUsedAt
                        ? format(new Date(k.lastUsedAt), "PPp")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(k.createdAt), "PP")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRevokeKeyId(k.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              Give this key a name and choose the scope. The full key will be
              shown once and cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                placeholder="e.g. Production server"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={createScopePreset}
                onChange={(e) =>
                  setCreateScopePreset(e.target.value as "full" | "read")
                }
              >
                {SCOPE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createName.trim() || createLoading}
            >
              {createLoading ? "Creating…" : "Create key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show key once dialog */}
      <Dialog
        open={!!createdKey}
        onOpenChange={(open) => !open && setCreatedKey(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API key created</DialogTitle>
            <DialogDescription>
              Copy this key now. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3 font-mono text-sm break-all">
            {createdKey?.key}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyKey}
            className="w-full"
          >
            {copiedKey ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy key
              </>
            )}
          </Button>
          <DialogFooter>
            <Button onClick={() => setCreatedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <AlertDialog
        open={!!revokeKeyId}
        onOpenChange={(open) => !open && setRevokeKeyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately invalidate the key. Any requests using it
              will fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeKeyId && handleRevoke(revokeKeyId)}
              disabled={revokeLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeLoading ? "Revoking…" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
