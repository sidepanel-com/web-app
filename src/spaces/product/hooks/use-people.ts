"use client";

import { useState, useCallback, useEffect } from "react";
import { useProductSdk } from "./use-product-sdk";
import { Person, NewPerson } from "@db/product/types";
import { toast } from "sonner";

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

  const createPerson = async (data: Omit<NewPerson, "id" | "tenantId" | "createdAt" | "updatedAt">) => {
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
    createPerson,
    updatePerson,
    deletePerson,
  };
}

