"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui-primitives/ui/card";
import { Switch } from "@/ui-primitives/ui/switch";
import { Badge } from "@/ui-primitives/ui/badge";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";

const PACKAGE_CATALOG = [
  {
    id: "workspace",
    name: "Workspace",
    description:
      "Core package for managing people, companies, and communications. Powers the SidePanel experience.",
  },
  {
    id: "sales",
    name: "Sales",
    description:
      "Pipeline management, deal tracking, and revenue forecasting.",
    comingSoon: true,
  },
] as const;

interface PackageState {
  packageId: string;
  enabled: boolean;
}

export function PackagesSettings() {
  const { tenant, reloadPackages } = usePlatformTenant();
  const [states, setStates] = useState<PackageState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchStates = useCallback(async () => {
    if (!tenant) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/packages`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const json = await res.json();
      setStates(json.data as PackageState[]);
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  const togglePackage = async (packageId: string, enabled: boolean) => {
    if (!tenant) return;
    setSaving(packageId);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/packages`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, enabled }),
      });
      if (res.ok) {
        setStates((prev) => {
          const exists = prev.some((s) => s.packageId === packageId);
          if (exists) {
            return prev.map((s) =>
              s.packageId === packageId ? { ...s, enabled } : s,
            );
          }
          return [...prev, { packageId, enabled }];
        });
        reloadPackages();
      }
    } finally {
      setSaving(null);
    }
  };

  const isEnabled = (packageId: string) =>
    states.find((s) => s.packageId === packageId)?.enabled ?? true;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Packages</h2>
        <p className="text-muted-foreground">
          Enable or disable packages to control what features are available in
          the SidePanel.
        </p>
      </div>

      <div className="grid gap-4">
        {PACKAGE_CATALOG.map((pkg) => {
          const enabled = isEnabled(pkg.id);
          const isComingSoon = "comingSoon" in pkg && pkg.comingSoon;

          return (
            <Card key={pkg.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {pkg.name}
                    {isComingSoon && (
                      <Badge variant="outline">Coming Soon</Badge>
                    )}
                  </CardTitle>
                </div>
                <Switch
                  checked={enabled}
                  disabled={loading || isComingSoon || saving === pkg.id}
                  onCheckedChange={(checked) => togglePackage(pkg.id, checked)}
                />
              </CardHeader>
              <CardContent>
                <CardDescription>{pkg.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
