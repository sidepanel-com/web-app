"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/ui-primitives/ui/button";
import { Badge } from "@/ui-primitives/ui/badge";
import { Skeleton } from "@/ui-primitives/ui/skeleton";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useProductSdk } from "@/spaces/packages/workspace/hooks/use-product-sdk";
import { ActivityFeed } from "@/spaces/packages/workspace/ui/activities/activity-feed";
import type { PersonDetailResult } from "@/spaces/packages/workspace/server/people.service";
import type { ActivityDTO } from "@/spaces/packages/workspace/types";

interface PersonDetailProps {
  personId: string;
  onBack: () => void;
  onSelectCompany?: (companyId: string) => void;
  onSelectActivity?: (activity: ActivityDTO) => void;
}

export function PersonDetail({
  personId,
  onBack,
  onSelectCompany,
  onSelectActivity,
}: PersonDetailProps) {
  const sdk = useProductSdk();
  const [person, setPerson] = useState<PersonDetailResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!sdk) return;
    setIsLoading(true);
    try {
      const res = await sdk.people.getPerson(personId);
      if (res.success && res.data) {
        setPerson(res.data as unknown as PersonDetailResult);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, personId]);

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

  if (!person) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Person not found
      </div>
    );
  }

  const fullName = [person.firstName, person.lastName].filter(Boolean).join(" ");
  const primaryCompany = person.companies?.[0];
  const emailComm = person.comms?.find((c) => c.type === "email");
  const phoneComm = person.comms?.find((c) => c.type === "phone");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Person
          </p>
          <h2 className="text-lg font-bold">{fullName}</h2>
          {primaryCompany && (
            <p className="text-sm text-muted-foreground">
              <button
                type="button"
                className="hover:underline"
                onClick={() => onSelectCompany?.(primaryCompany.id)}
              >
                {primaryCompany.name}
              </button>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {person.title && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                Title
              </p>
              <p>{person.title}</p>
            </div>
          )}

          {emailComm && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                Email
              </p>
              <p className="truncate">{emailComm.canonicalValue}</p>
            </div>
          )}

          {phoneComm && (
            <div className="flex items-center gap-1.5">
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Phone
                </p>
                <p>{phoneComm.canonicalValue}</p>
              </div>
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-3" />
            </div>
          )}

          {person.projection?.ownerMemberProfileId && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                Owner
              </p>
              <p>Assigned</p>
            </div>
          )}

          {person.projection?.status && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                Status
              </p>
              <Badge variant="outline" className="text-xs">
                {person.projection.status}
              </Badge>
            </div>
          )}

          {person.projection?.isVip && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                VIP
              </p>
              <p>Yes</p>
            </div>
          )}
        </div>
      </div>

      <ActivityFeed
        personId={personId}
        showFilters={false}
        onSelectActivity={onSelectActivity}
      />
    </div>
  );
}
