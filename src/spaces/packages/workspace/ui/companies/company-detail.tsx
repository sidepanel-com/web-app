"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/ui-primitives/ui/button";
import { Avatar, AvatarFallback } from "@/ui-primitives/ui/avatar";
import { Skeleton } from "@/ui-primitives/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useProductSdk } from "@/spaces/packages/workspace/hooks/use-product-sdk";
import { ActivityFeed } from "@/spaces/packages/workspace/ui/activities/activity-feed";
import type { CompanyDetailResult } from "@/spaces/packages/workspace/server/companies.service";
import type { ActivityDTO } from "@/spaces/packages/workspace/types";

interface CompanyDetailProps {
  companyId: string;
  onBack: () => void;
  onSelectPerson?: (personId: string) => void;
  onSelectActivity?: (activity: ActivityDTO) => void;
}

export function CompanyDetail({
  companyId,
  onBack,
  onSelectPerson,
  onSelectActivity,
}: CompanyDetailProps) {
  const sdk = useProductSdk();
  const [company, setCompany] = useState<CompanyDetailResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!sdk) return;
    setIsLoading(true);
    try {
      const res = await sdk.companies.getCompany(companyId);
      if (res.success && res.data) {
        setCompany(res.data as unknown as CompanyDetailResult);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, companyId]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Company not found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Company
          </p>
          <h2 className="text-lg font-bold">{company.name}</h2>
          <p className="text-sm text-muted-foreground">
            {company.contactCount} contact{company.contactCount !== 1 ? "s" : ""}
            {company.projection?.status && ` · ${company.projection.status}`}
          </p>
        </div>

        {company.people && company.people.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Related People
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              {company.people.length} contact{company.people.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {company.people.map((person) => {
                const initials =
                  (person.firstName?.[0] ?? "") + (person.lastName?.[0] ?? "");
                const fullName = [person.firstName, person.lastName]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    key={person.id}
                    type="button"
                    className="flex items-center gap-2 border rounded-lg px-3 py-2 min-w-0 hover:bg-muted/50 transition-colors"
                    onClick={() => onSelectPerson?.(person.id)}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {initials.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-semibold truncate">
                        {fullName}
                      </p>
                      {person.role && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {person.role}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ActivityFeed
        companyId={companyId}
        showFilters={false}
        onSelectActivity={onSelectActivity}
        onSelectPerson={onSelectPerson}
      />
    </div>
  );
}
