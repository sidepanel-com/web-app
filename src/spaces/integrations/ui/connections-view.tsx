import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/ui-primitives/ui/card";
import { Badge } from "@/ui-primitives/ui/badge";
import { Button } from "@/ui-primitives/ui/button";
import { Mail, Calendar, CreditCard } from "lucide-react";

export function ConnectionsView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Connections</h2>
        <p className="text-muted-foreground">
          Manage your personal and tenant-level external integrations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Gmail */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Mail className="size-5 text-blue-600" />
                </div>
                <CardTitle>Gmail</CardTitle>
              </div>
              <Badge variant="outline">User</Badge>
            </div>
            <CardDescription className="pt-2">
              Sync your emails directly into the CRM timeline.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full">
              Connect Gmail
            </Button>
          </CardFooter>
        </Card>

        {/* Google Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Calendar className="size-5 text-red-600" />
                </div>
                <CardTitle>Google Calendar</CardTitle>
              </div>
              <Badge variant="outline">User</Badge>
            </div>
            <CardDescription className="pt-2">
              Keep your meetings and availability in sync.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full">
              Connect GCal
            </Button>
          </CardFooter>
        </Card>

        {/* Quickbooks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CreditCard className="size-5 text-green-600" />
                </div>
                <CardTitle>Quickbooks</CardTitle>
              </div>
              <Badge variant="secondary">Tenant</Badge>
            </div>
            <CardDescription className="pt-2">
              Shared accounting data for the entire organization.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full">
              Connect QB
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

