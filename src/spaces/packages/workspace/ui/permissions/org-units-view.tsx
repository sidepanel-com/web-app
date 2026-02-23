import { Button } from "@/ui-primitives/ui/button";
import { Plus } from "lucide-react";

export function OrgUnitsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Org Units</h2>
          <p className="text-muted-foreground">
            Manage your organizational hierarchy. Org units control how data
            visibility is scoped across your team.
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Create Org Unit
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-medium">No org units yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first org unit to start building your organizational
          structure.
        </p>
      </div>
    </div>
  );
}
