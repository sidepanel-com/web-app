import { PipedreamClient } from "@pipedream/sdk/browser";
import {
  IntegrationMethod,
  IntegrationProvider,
} from "@/spaces/integrations/core/types";
import { Badge } from "@/ui-primitives/ui/badge";
import { Button } from "@/ui-primitives/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui-primitives/ui/card";
import { useEffect, useState } from "react";
import { useIntegrations } from "@/spaces/integrations/hooks/use-integrations";
import { IntegrationListItem } from "@/spaces/platform/client-sdk/integrations.client-api";
import { Mail, Calendar, CreditCard } from "lucide-react";

interface IntegrationCardProps {
  provider: IntegrationProvider;
  method: IntegrationMethod;
  existingIntegration?: IntegrationListItem;
  enabled?: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: "User" | "Tenant";
}

export function IntegrationCard({
  provider,
  method,
  existingIntegration,
  enabled = true,
  title,
  description,
  icon,
  type,
}: IntegrationCardProps) {
  const {
    connectAsync,
    isConnecting,
    disconnect,
    isDisconnecting,
    finalizeConnection,
    connectError,
    sync,
    refetch,
  } = useIntegrations();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try {
      // 1. Sync first to check for existing valid connection
      await sync();
      
      // We don't have refetch return value in our hook, so we just rely on state update
      // But for the flow, we can just proceed to connectAsync

      // 2. Get a new token
      const result = await connectAsync({ provider, method });

      if (
        result.connectionData &&
        typeof result.connectionData === "object" &&
        "connectToken" in result.connectionData &&
        "externalUserId" in result.connectionData
      ) {
        const { connectToken, externalUserId } =
          result.connectionData as {
            connectToken: string;
            externalUserId: string;
          };

        // 3. Recreate the PD client SDK
        const pd = new PipedreamClient({
          externalUserId,
          // This tokenCallback is required by the SDK but not used for Connect flow if we provide a token
          tokenCallback: async () => ({
            accessToken: "",
            expiresAt: new Date(),
            token: "",
            connectLinkUrl: "",
          }),
        });

        // 4. Connect with the new token
        pd.connectAccount({
          token: connectToken,
          app: provider,
          onSuccess: (account: any) => {
            console.log("Connected to Pipedream", account);
            finalizeConnection({
                provider,
                method,
                providerAccountId: account.id,
                connectionData: account
            });
          },
          onError: (err: any) => {
            console.log("Failed to connect to Pipedream", err);
            setError("Failed to connect to Pipedream");
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  useEffect(() => {
    if (connectError) {
      setError(connectError.message);
    }
  }, [connectError]);

  const handleDisconnect = () => {
    disconnect(provider, method);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-muted">
              {icon}
            </div>
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge variant={type === "User" ? "outline" : "secondary"}>{type}</Badge>
        </div>
        <CardDescription className="pt-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {existingIntegration ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <Badge variant={existingIntegration.isActive ? "default" : "secondary"}>
                    {existingIntegration.isActive ? "Active" : "Inactive"}
                </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Connected as: {existingIntegration.providerAccountId}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Not connected
            </div>
            {error && (
              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                Error: {error}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {existingIntegration ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleDisconnect}
            disabled={isDisconnecting || !enabled}
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={handleConnect}
            disabled={isConnecting || !enabled}
          >
            {isConnecting ? "Connecting..." : `Connect ${title}`}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

