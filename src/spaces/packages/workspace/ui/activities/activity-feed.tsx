"use client";

import { useActivities } from "@/spaces/packages/workspace/hooks/use-activities";
import { ActivityCard } from "./activity-card";
import { ActivityFilters } from "./activity-filters";
import { Skeleton } from "@/ui-primitives/ui/skeleton";
import { Alert, AlertDescription } from "@/ui-primitives/ui/alert";
import { AlertCircle } from "lucide-react";
import type { ActivityDTO, ActivityType } from "@/spaces/packages/workspace/types";

interface ActivityFeedProps {
  personId?: string;
  companyId?: string;
  onSelectActivity?: (activity: ActivityDTO) => void;
  onSelectPerson?: (personId: string) => void;
  onSelectCompany?: (_companyId: string) => void;
  showFilters?: boolean;
}

export function ActivityFeed({
  personId,
  companyId,
  onSelectActivity,
  onSelectPerson,
  showFilters = true,
}: ActivityFeedProps) {
  const {
    activities,
    isLoading,
    error,
    filters,
    setTypeFilter,
  } = useActivities({ personId, companyId });

  const handleSelect = (activity: ActivityDTO) => {
    if (onSelectActivity) {
      onSelectActivity(activity);
    } else if (activity.person && onSelectPerson) {
      onSelectPerson(activity.person.id);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {showFilters && (
        <ActivityFilters
          activeType={filters.type as ActivityType | undefined}
          onTypeChange={setTypeFilter}
        />
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {isLoading ? (
          [0, 1, 2, 3].map((n) => (
            <div key={`skeleton-${n}`} className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))
        ) : activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onSelect={handleSelect}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No activities found
          </div>
        )}
      </div>
    </div>
  );
}
