"use client";

import React, { useState } from "react";
import { CompaniesList } from "./companies-list";
import { CompanyFormDialog } from "./company-form-dialog";
import { useCompanies } from "@/spaces/product/hooks/use-companies";
import { Company } from "@db/product/types";
import { Alert, AlertDescription } from "@/ui-primitives/ui/alert";
import { AlertCircle } from "lucide-react";

export function CompaniesView() {
  const {
    companies,
    isLoading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
  } = useCompanies();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const handleCreateClick = () => {
    setSelectedCompany(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (company: Company) => {
    setSelectedCompany(company);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: any) => {
    if (selectedCompany) {
      await updateCompany(selectedCompany.id, values);
    } else {
      await createCompany(values);
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
      />
    </div>
  );
}

