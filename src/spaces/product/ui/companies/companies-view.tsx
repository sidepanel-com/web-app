"use client";

import { useState } from "react";
import { CompaniesList } from "./companies-list";
import { CompanyFormDialog } from "./company-form-dialog";
import { useCompanies } from "@/spaces/product/hooks/use-companies";
import type { Company, Person, Comm } from "@db/product/types";
import { Alert, AlertDescription } from "@/ui-primitives/ui/alert";
import { AlertCircle } from "lucide-react";

export function CompaniesView() {
  const {
    companies,
    isLoading,
    error,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    addPerson,
    createAndLinkPerson,
    removePerson,
    createAndLinkComm,
    removeComm,
  } = useCompanies();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<(Company & { people: Person[], comms: Comm[] }) | null>(null);

  const handleCreateClick = () => {
    setSelectedCompany(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = async (company: Company) => {
    const fullCompany = await getCompany(company.id);
    if (fullCompany) {
      setSelectedCompany(fullCompany);
      setIsDialogOpen(true);
    }
  };

  const handleSubmit = async (values: any) => {
    if (selectedCompany) {
      await updateCompany(selectedCompany.id, values);
    } else {
      await createCompany(values);
    }
  };

  const refreshCompany = async () => {
    if (selectedCompany) {
      const updated = await getCompany(selectedCompany.id);
      if (updated) setSelectedCompany(updated);
    }
  };

  const handleAddPerson = async (personId: string) => {
    if (selectedCompany) {
      const success = await addPerson(selectedCompany.id, personId);
      if (success) await refreshCompany();
    }
  };

  const handleCreatePerson = async (firstName: string, lastName: string) => {
    if (selectedCompany) {
      const person = await createAndLinkPerson(selectedCompany.id, { firstName, lastName });
      if (person) await refreshCompany();
    }
  };

  const handleRemovePerson = async (personId: string) => {
    if (selectedCompany) {
      const success = await removePerson(selectedCompany.id, personId);
      if (success) await refreshCompany();
    }
  };

  const handleAddComm = async (type: string, value: any) => {
    if (selectedCompany) {
      const comm = await createAndLinkComm(selectedCompany.id, {
        type: type as any,
        value,
        canonicalValue: value, // or provide canonical formatting logic if required
      });
      if (comm) await refreshCompany();
    }
  };

  const handleRemoveComm = async (commId: string) => {
    if (selectedCompany) {
      const success = await removeComm(selectedCompany.id, commId);
      if (success) await refreshCompany();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Companies</h2>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-hidden">
        <CompaniesList
          companies={companies}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectCompany={handleEditClick}
          onCreateCompany={handleCreateClick}
        />
      </div>

      <CompanyFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        company={selectedCompany}
        onSubmit={handleSubmit}
        onDelete={deleteCompany}
        onAddPerson={handleAddPerson}
        onCreatePerson={handleCreatePerson}
        onRemovePerson={handleRemovePerson}
        onAddComm={handleAddComm}
        onRemoveComm={handleRemoveComm}
      />
    </div>
  );
}

