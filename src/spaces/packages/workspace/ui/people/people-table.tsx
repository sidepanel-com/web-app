"use client";

import type { Person } from "@/spaces/packages/workspace/types";
import { Skeleton } from "@/ui-primitives/ui/skeleton";

interface PeopleTableProps {
  people: Person[];
  isLoading: boolean;
  onSelectPerson: (person: Person) => void;
}

export function PeopleTable({
  people,
  isLoading,
  onSelectPerson,
}: PeopleTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((n) => (
          <Skeleton key={`skeleton-${n}`} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No people yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Name
            </th>
            <th className="text-left py-2 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Company
            </th>
            <th className="text-left py-2 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Last Activity
            </th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => {
            const fullName = [person.firstName, person.lastName]
              .filter(Boolean)
              .join(" ");
            return (
              <tr
                key={person.id}
                className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onSelectPerson(person)}
              >
                <td className="py-2.5 px-2">
                  <span className="font-medium">{fullName}</span>
                </td>
                <td className="py-2.5 px-2 text-muted-foreground">&mdash;</td>
                <td className="py-2.5 px-2 text-muted-foreground">&mdash;</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
