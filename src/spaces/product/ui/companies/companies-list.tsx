"use client";

import React from "react";
import { Company } from "@db/product/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui-primitives/ui/avatar";
import { Button } from "@/ui-primitives/ui/button";
import { Search, Plus } from "lucide-react";
import { Input } from "@/ui-primitives/ui/input";
import { Skeleton } from "@/ui-primitives/ui/skeleton";

interface CompaniesListProps {
  companies: Company[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectCompany: (company: Company) => void;
  onCreateCompany: () => void;
}

export function CompaniesList({
  companies,
  isLoading,
  searchQuery,
  onSearchChange,
  onSelectCompany,
  onCreateCompany,
}: CompaniesListProps) {
  const filteredCompanies = companies.filter((company) => {
    return company.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search companies..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button size="icon" onClick={onCreateCompany}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 border rounded-md">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : filteredCompanies.length > 0 ? (
          filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onSelectCompany(company)}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border rounded-md">
                  <AvatarImage src={company.logoUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary rounded-md">
                    {company.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{company.name}</div>
                  {company.domain && (
                    <div className="text-xs text-muted-foreground">
                      {company.domain}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" type="button">
                Edit
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No results found" : "No companies yet"}
          </div>
        )}
      </div>
    </div>
  );
}

