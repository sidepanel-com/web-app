import { IntegrationsList } from "./integrations-list";

export function ConnectionsView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Connections</h2>
        <p className="text-muted-foreground">
          Manage your personal and tenant-level external integrations.
        </p>
      </div>

      <IntegrationsList />
    </div>
  );
}
