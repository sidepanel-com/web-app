"use client";

import { useState, useCallback, useEffect } from "react";
import { useProductSdk } from "./use-product-sdk";
import { Company, NewCompany } from "@db/product/types";
import { toast } from "sonner";

export function useCompanies() {
  const sdk = useProductSdk();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    if (!sdk) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await sdk.companies.getCompanies();
      if (response.success && response.data) {
        setCompanies(response.data);
      } else {
        setError(response.error || "Failed to load companies");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  const createCompany = async (data: Omit<NewCompany, "id" | "tenantId" | "createdAt" | "updatedAt">) => {
    if (!sdk) return;

    try {
      const response = await sdk.companies.createCompany(data);
      if (response.success && response.data) {
        setCompanies((prev) => [...prev, response.data!]);
        toast.success("Company created successfully");
        return response.data;
      } else {
        toast.error(response.error || "Failed to create company");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const updateCompany = async (
    companyId: string,
    data: Partial<Omit<Company, "id" | "tenantId" | "createdAt" | "updatedAt">>
  ) => {
    if (!sdk) return;

    try {
      const response = await sdk.companies.updateCompany(companyId, data);
      if (response.success && response.data) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === companyId ? response.data! : c))
        );
        toast.success("Company updated successfully");
        return response.data;
      } else {
        toast.error(response.error || "Failed to update company");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const deleteCompany = async (companyId: string) => {
    if (!sdk) return;

    try {
      const response = await sdk.companies.deleteCompany(companyId);
      if (response.success) {
        setCompanies((prev) => prev.filter((c) => c.id !== companyId));
        toast.success("Company deleted successfully");
      } else {
        toast.error(response.error || "Failed to delete company");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  useEffect(() => {
    if (sdk) {
      loadCompanies();
    }
  }, [sdk, loadCompanies]);

  return {
    companies,
    isLoading,
    error,
    loadCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}

