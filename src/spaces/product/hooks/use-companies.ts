"use client";

import { useState, useCallback, useEffect } from "react";
import { useProductSdk } from "./use-product-sdk";
import { Company, NewCompany, Person, NewPerson, Comm, NewComm } from "@db/product/types";
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

  const getCompany = useCallback(async (companyId: string) => {
    if (!sdk) return null;
    try {
      const response = await sdk.companies.getCompany(companyId);
      if (response.success && response.data) {
        return response.data as (Company & { people: Person[], comms: Comm[] });
      }
    } catch (err) {
      console.error(err);
    }
    return null;
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

  /* =========================
     ASSOCIATIONS (PEOPLE)
  ========================= */

  const addPerson = async (
    companyId: string,
    personId: string,
    role?: string,
    isPrimary?: boolean
  ) => {
    if (!sdk) return;
    try {
      const response = await sdk.companies.addPerson(
        companyId,
        personId,
        role,
        isPrimary
      );
      if (response.success) {
        toast.success("Person linked successfully");
        return true;
      } else {
        toast.error(response.error || "Failed to link person");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
    return false;
  };

  const createAndLinkPerson = async (
    companyId: string,
    data: Omit<NewPerson, "id" | "tenantId" | "createdAt" | "updatedAt">,
    role?: string,
    isPrimary?: boolean
  ) => {
    if (!sdk) return;
    try {
      const response = await sdk.companies.createNewPerson(
        companyId,
        data,
        role,
        isPrimary
      );
      if (response.success && response.data) {
        toast.success("Person created and linked successfully");
        return response.data;
      } else {
        toast.error(response.error || "Failed to create and link person");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const removePerson = async (companyId: string, personId: string) => {
    if (!sdk) return;
    try {
      const response = await sdk.companies.removePerson(companyId, personId);
      if (response.success) {
        toast.success("Person unlinked successfully");
        return true;
      } else {
        toast.error(response.error || "Failed to unlink person");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
    return false;
  };

  /* =========================
     ASSOCIATIONS (COMMS)
  ========================= */

  const addComm = async (companyId: string, commId: string) => {
    if (!sdk) return;
    try {
      const response = await sdk.companies.addComm(companyId, commId);
      if (response.success) {
        toast.success("Comm linked successfully");
        return true;
      } else {
        toast.error(response.error || "Failed to link comm");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
    return false;
  };

  const createAndLinkComm = async (
    companyId: string,
    data: Omit<NewComm, "id" | "tenantId" | "createdAt" | "updatedAt">
  ) => {
    if (!sdk) return;
    try {
      const response = await sdk.companies.createNewComm(companyId, data);
      if (response.success && response.data) {
        toast.success("Comm created and linked successfully");
        return response.data;
      } else {
        toast.error(response.error || "Failed to create and link comm");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const removeComm = async (companyId: string, commId: string) => {
    if (!sdk) return;
    try {
      const response = await sdk.companies.removeComm(companyId, commId);
      if (response.success) {
        toast.success("Comm unlinked successfully");
        return true;
      } else {
        toast.error(response.error || "Failed to unlink comm");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
    return false;
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
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    addPerson,
    createAndLinkPerson,
    removePerson,
    addComm,
    createAndLinkComm,
    removeComm,
  };
}
