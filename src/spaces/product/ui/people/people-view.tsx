"use client";

import React, { useState } from "react";
import { PeopleList } from "./people-list";
import { PersonFormDialog } from "./person-form-dialog";
import { usePeople } from "@/spaces/product/hooks/use-people";
import { Person, Company, Comm } from "@db/product/types";
import { Alert, AlertDescription } from "@/ui-primitives/ui/alert";
import { AlertCircle } from "lucide-react";

export function PeopleView() {
  const {
    people,
    isLoading,
    error,
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
  } = usePeople();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<(Person & { companies: Company[], comms: Comm[] }) | null>(null);

  const handleCreateClick = () => {
    setSelectedPerson(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = async (person: Person) => {
    const fullPerson = await getPerson(person.id);
    if (fullPerson) {
      setSelectedPerson(fullPerson);
      setIsDialogOpen(true);
    }
  };

  const handleSubmit = async (values: any) => {
    if (selectedPerson) {
      await updatePerson(selectedPerson.id, values);
    } else {
      await createPerson(values);
    }
  };

  const refreshPerson = async () => {
    if (selectedPerson) {
      const updated = await getPerson(selectedPerson.id);
      if (updated) setSelectedPerson(updated);
    }
  };

  const handleAddCompany = async (companyId: string) => {
    if (selectedPerson) {
      const success = await addCompany(selectedPerson.id, companyId);
      if (success) await refreshPerson();
    }
  };

  const handleCreateCompany = async (name: string, domain?: string) => {
    if (selectedPerson) {
      const company = await createAndLinkCompany(selectedPerson.id, { name, domain });
      if (company) await refreshPerson();
    }
  };

  const handleRemoveCompany = async (companyId: string) => {
    if (selectedPerson) {
      const success = await removeCompany(selectedPerson.id, companyId);
      if (success) await refreshPerson();
    }
  };

  const handleAddComm = async (type: string, value: any) => {
    if (selectedPerson) {
      const comm = await createAndLinkComm(selectedPerson.id, { type: type as any, value });
      if (comm) await refreshPerson();
    }
  };

  const handleRemoveComm = async (commId: string) => {
    if (selectedPerson) {
      const success = await removeComm(selectedPerson.id, commId);
      if (success) await refreshPerson();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">People</h2>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-hidden">
        <PeopleList
          people={people}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectPerson={handleEditClick}
          onCreatePerson={handleCreateClick}
        />
      </div>

      <PersonFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        person={selectedPerson}
        onSubmit={handleSubmit}
        onDelete={deletePerson}
        onAddCompany={handleAddCompany}
        onCreateCompany={handleCreateCompany}
        onRemoveCompany={handleRemoveCompany}
        onAddComm={handleAddComm}
        onRemoveComm={handleRemoveComm}
      />
    </div>
  );
}

