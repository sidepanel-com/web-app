"use client";

import React, { useState } from "react";
import { PeopleList } from "./people-list";
import { PersonFormDialog } from "./person-form-dialog";
import { usePeople } from "@/spaces/product/hooks/use-people";
import { Person } from "@db/product/types";
import { Alert, AlertDescription } from "@/ui-primitives/ui/alert";
import { AlertCircle } from "lucide-react";

export function PeopleView() {
  const {
    people,
    isLoading,
    error,
    createPerson,
    updatePerson,
    deletePerson,
  } = usePeople();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const handleCreateClick = () => {
    setSelectedPerson(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (person: Person) => {
    setSelectedPerson(person);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: any) => {
    if (selectedPerson) {
      await updatePerson(selectedPerson.id, values);
    } else {
      await createPerson(values);
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
      />
    </div>
  );
}

