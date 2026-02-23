"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui-primitives/ui/card";
import { Switch } from "@/ui-primitives/ui/switch";
import { Badge } from "@/ui-primitives/ui/badge";

const packages = [
  {
    id: "workspace",
    name: "Workspace",
    description:
      "Core package for managing people, companies, and communications. Powers the SidePanel experience.",
    alwaysEnabled: true,
  },
  {
    id: "sales",
    name: "Sales",
    description:
      "Pipeline management, deal tracking, and revenue forecasting.",
    comingSoon: true,
    alwaysEnabled: false,
  },
] as const;

export function PackagesSettings() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    workspace: true,
  });

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
        {packages.map((pkg) => {
          const isEnabled = pkg.alwaysEnabled || enabled[pkg.id] || false;
          const isComingSoon = "comingSoon" in pkg && pkg.comingSoon;

          return (
            <Card key={pkg.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {pkg.name}
                    {pkg.alwaysEnabled && (
                      <Badge variant="secondary">Core</Badge>
                    )}
                    {isComingSoon && (
                      <Badge variant="outline">Coming Soon</Badge>
                    )}
                  </CardTitle>
                </div>
                <Switch
                  checked={isEnabled}
                  disabled={pkg.alwaysEnabled || isComingSoon}
                  onCheckedChange={(checked) =>
                    setEnabled((prev) => ({ ...prev, [pkg.id]: checked }))
                  }
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
