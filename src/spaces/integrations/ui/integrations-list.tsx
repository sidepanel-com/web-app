import { useIntegrations } from "@/spaces/integrations/hooks/use-integrations";
import { IntegrationCard } from "./integration-card";
import { IntegrationMethod, IntegrationProvider } from "@/spaces/integrations/core/types";
import { Mail, Calendar, CreditCard } from "lucide-react";

export function IntegrationsList() {
  const { integrations, isLoading } = useIntegrations();

  if (isLoading && integrations.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[200px] rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const availableIntegrations = [
    {
      provider: IntegrationProvider.GOOGLE,
      method: IntegrationMethod.PIPEDREAM_CONNECT,
      title: "Gmail",
      description: "Sync your emails directly into the CRM timeline.",
      icon: <Mail className="size-5 text-blue-600" />,
      type: "User" as const,
      enabled: true,
    },
    {
      provider: IntegrationProvider.GOOGLE, // Future: Calendar
      method: IntegrationMethod.PIPEDREAM_CONNECT,
      title: "Google Calendar",
      description: "Keep your meetings and availability in sync.",
      icon: <Calendar className="size-5 text-red-600" />,
      type: "User" as const,
      enabled: false,
    },
    {
      provider: IntegrationProvider.QUICKBOOKS,
      method: IntegrationMethod.PIPEDREAM_CONNECT,
      title: "Quickbooks",
      description: "Shared accounting data for the entire organization.",
      icon: <CreditCard className="size-5 text-green-600" />,
      type: "Tenant" as const,
      enabled: false,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {availableIntegrations.map((integration) => {
        const existing = integrations.find(
          (i) => i.provider === integration.provider && i.method === integration.method
        );

        return (
          <IntegrationCard
            key={`${integration.provider}-${integration.method}-${integration.title}`}
            {...integration}
            existingIntegration={existing}
          />
        );
      })}
    </div>
  );
}

