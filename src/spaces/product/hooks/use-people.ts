"use client";

import { useState, useCallback, useEffect } from "react";
import { useProductSdk } from "./use-product-sdk";
import {
  Person,
  NewPerson,
  CompanyWithWeb,
  NewCompany,
  Comm,
  NewComm,
} from "@db/product/types";
import { toast } from "sonner";

type CompanyDomainInput = { domain: string; isPrimary?: boolean };
type CompanyWebsiteInput = { url: string; type?: string; isPrimary?: boolean };
type CompanyCreatePayload = Omit<
  NewCompany,
  "id" | "tenantId" | "createdAt" | "updatedAt"
> & {
  domains?: CompanyDomainInput[];
  websites?: CompanyWebsiteInput[];
};

export function usePeople() {
  const sdk = useProductSdk();
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPeople = useCallback(async () => {
    if (!sdk) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await sdk.people.getPeople();
      if (response.success && response.data) {
        setPeople(response.data);
      } else {
        setError(response.error || "Failed to load people");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  const getPerson = useCallback(
    async (personId: string) => {
      if (!sdk) return null;
      try {
        const response = await sdk.people.getPerson(personId);
        if (response.success && response.data) {
          return response.data;
        }
      } catch (err) {
        console.error(err);
      }
      return null;
    },
    [sdk]
  );

  const createPerson = async (
    data: Omit<NewPerson, "id" | "tenantId" | "createdAt" | "updatedAt">
  ) => {
    if (!sdk) return;

    try {
      const response = await sdk.people.createPerson(data);
      if (response.success && response.data) {
        setPeople((prev) => [...prev, response.data!]);
        toast.success("Person created successfully");
        return response.data;
      } else {
        toast.error(response.error || "Failed to create person");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const updatePerson = async (
    personId: string,
    data: Partial<Omit<Person, "id" | "tenantId" | "createdAt" | "updatedAt">>
  ) => {
    if (!sdk) return;

    try {
      const response = await sdk.people.updatePerson(personId, data);
      if (response.success && response.data) {
        setPeople((prev) =>
          prev.map((p) => (p.id === personId ? response.data! : p))
        );
        toast.success("Person updated successfully");
        return response.data;
      } else {
        toast.error(response.error || "Failed to update person");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const deletePerson = async (personId: string) => {
    if (!sdk) return;

    try {
      const response = await sdk.people.deletePerson(personId);
      if (response.success) {
        setPeople((prev) => prev.filter((p) => p.id !== personId));
        toast.success("Person deleted successfully");
      } else {
        toast.error(response.error || "Failed to delete person");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  /* =========================
     ASSOCIATIONS (COMPANIES)
  ========================= */

  const addCompany = async (
    personId: string,
    companyId: string,
    role?: string,
    isPrimary?: boolean
  ) => {
    if (!sdk) return;
    try {
      const response = await sdk.people.addCompany(
        personId,
        companyId,
        role,
        isPrimary
      );
      if (response.success) {
        toast.success("Company linked successfully");
        return true;
      } else {
        toast.error(response.error || "Failed to link company");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
    return false;
  };

  const createAndLinkCompany = async (
    personId: string,
    data: CompanyCreatePayload,
    role?: string,
    isPrimary?: boolean
  ) => {
    if (!sdk) return;
    try {
      const response = await sdk.people.createNewCompany(
        personId,
        data,
        role,
        isPrimary
      );
      if (response.success && response.data) {
        toast.success("Company created and linked successfully");
        return response.data;
      } else {
        toast.error(response.error || "Failed to create and link company");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const removeCompany = async (personId: string, companyId: string) => {
    if (!sdk) return;
    try {
      const response = await sdk.people.removeCompany(personId, companyId);
      if (response.success) {
        toast.success("Company unlinked successfully");
        return true;
      } else {
        toast.error(response.error || "Failed to unlink company");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
    return false;
  };

  /* =========================
     ASSOCIATIONS (COMMS)
  ========================= */

  const addComm = async (personId: string, commId: string) => {
    if (!sdk) return;
    try {
      const response = await sdk.people.addComm(personId, commId);
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
    personId: string,
    data: Omit<NewComm, "id" | "tenantId" | "createdAt" | "updatedAt">
  ) => {
    if (!sdk) return;
    try {
      const response = await sdk.people.createNewComm(personId, data);
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

  const removeComm = async (personId: string, commId: string) => {
    if (!sdk) return;
    try {
      const response = await sdk.people.removeComm(personId, commId);
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
      loadPeople();
    }
  }, [sdk, loadPeople]);

  return {
    people,
    isLoading,
    error,
    loadPeople,
    getPerson,
    createPerson,
    updatePerson,
    deletePerson,
    addCompany,
    createAndLinkCompany,
    removeCompany,
    addComm,
    createAndLinkComm,
    removeComm,
  };
}
