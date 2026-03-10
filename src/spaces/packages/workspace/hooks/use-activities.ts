"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useProductSdk } from "./use-product-sdk";
import type {
  ActivityDTO,
  ActivityDetailDTO,
  ActivityFilters,
  ActivityType,
} from "@/spaces/packages/workspace/types";

export function useActivities(initialFilters: ActivityFilters = {}) {
  const sdk = useProductSdk();
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadActivities = useCallback(
    async (overrideFilters?: ActivityFilters) => {
      if (!sdk) return;

      const activeFilters = overrideFilters ?? filtersRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const response = await sdk.activities.getActivities(activeFilters);
        if (response.success && response.data) {
          setActivities(response.data.activities);
          setTotal(response.data.total);
        } else {
          setError(response.error || "Failed to load activities");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [sdk],
  );

  const setTypeFilter = useCallback(
    (type: ActivityType | undefined) => {
      const next = { ...filtersRef.current, type, offset: 0 };
      setFilters(next);
      loadActivities(next);
    },
    [loadActivities],
  );

  const setPersonFilter = useCallback(
    (personId: string | undefined) => {
      const next = { ...filtersRef.current, personId, offset: 0 };
      setFilters(next);
      loadActivities(next);
    },
    [loadActivities],
  );

  const setCompanyFilter = useCallback(
    (companyId: string | undefined) => {
      const next = { ...filtersRef.current, companyId, offset: 0 };
      setFilters(next);
      loadActivities(next);
    },
    [loadActivities],
  );

  const loadMore = useCallback(() => {
    const next = {
      ...filtersRef.current,
      offset: (filtersRef.current.offset ?? 0) + (filtersRef.current.limit ?? 50),
    };
    setFilters(next);
    loadActivities(next);
  }, [loadActivities]);

  const getActivity = useCallback(
    async (activityId: string): Promise<ActivityDetailDTO | null> => {
      if (!sdk) return null;
      try {
        const response = await sdk.activities.getActivity(activityId);
        if (response.success && response.data) {
          return response.data;
        }
      } catch (err) {
        console.error(err);
      }
      return null;
    },
    [sdk],
  );

  useEffect(() => {
    if (sdk) {
      loadActivities();
    }
  }, [sdk, loadActivities]);

  return {
    activities,
    total,
    isLoading,
    error,
    filters,
    loadActivities,
    setTypeFilter,
    setPersonFilter,
    setCompanyFilter,
    loadMore,
    getActivity,
  };
}
