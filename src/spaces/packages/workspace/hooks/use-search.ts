"use client";

import { useState, useCallback, useRef } from "react";
import { useProductSdk } from "./use-product-sdk";
import type { SearchResultItem } from "@/spaces/packages/workspace/server/search.service";

interface SearchApiResponse {
  success: boolean;
  data?: { results: SearchResultItem[]; query: string };
  error?: string;
}

export function useSearch() {
  const sdk = useProductSdk();
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (q: string) => {
      setQuery(q);

      if (!q.trim()) {
        setResults([]);
        return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        if (!sdk) return;
        setIsSearching(true);
        try {
          const res = await fetch(
            `/api/v1/search?q=${encodeURIComponent(q)}`,
          );
          const data: SearchApiResponse = await res.json();
          if (data.success && data.data?.results) {
            setResults(data.data.results);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [sdk],
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
  }, []);

  return {
    results,
    isSearching,
    query,
    search,
    clearSearch,
  };
}
