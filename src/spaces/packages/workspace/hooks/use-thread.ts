"use client";

import { useState, useCallback, useEffect } from "react";
import { useProductSdk } from "./use-product-sdk";
import type { ThreadDTO } from "@/spaces/packages/workspace/server/threads.service";

export function useThread(personId: string | null) {
  const sdk = useProductSdk();
  const [thread, setThread] = useState<ThreadDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThread = useCallback(async () => {
    if (!sdk || !personId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await sdk.threads.getThreadForPerson(personId);
      if (response.success && response.data) {
        setThread(response.data);
      } else {
        setError(response.error || "Failed to load thread");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [sdk, personId]);

  useEffect(() => {
    if (personId) {
      loadThread();
    } else {
      setThread(null);
    }
  }, [personId, loadThread]);

  return {
    thread,
    isLoading,
    error,
    reload: loadThread,
  };
}
