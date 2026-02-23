"use client";

import React from "react";
import { Person } from "@db/ledger/types";
import { Avatar, AvatarFallback } from "@/ui-primitives/ui/avatar";
import { Button } from "@/ui-primitives/ui/button";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/ui-primitives/ui/input";
import { Skeleton } from "@/ui-primitives/ui/skeleton";

interface PeopleListProps {
  people: Person[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectPerson: (person: Person) => void;
  onCreatePerson: () => void;
}

export function PeopleList({
  people,
  isLoading,
  searchQuery,
  onSearchChange,
  onSelectPerson,
  onCreatePerson,
}: PeopleListProps) {
  const filteredPeople = people.filter((person) => {
    const fullName = `${person.firstName || ""} ${person.lastName || ""}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search people..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button size="icon" onClick={onCreatePerson}>
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 border rounded-md">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : filteredPeople.length > 0 ? (
          filteredPeople.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onSelectPerson(person)}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(person.firstName?.[0] || "") + (person.lastName?.[0] || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {person.firstName} {person.lastName}
                  </div>
                  {person.bio && (
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {person.bio}
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
            {searchQuery ? "No results found" : "No people yet"}
          </div>
        )}
      </div>
    </div>
  );
}

