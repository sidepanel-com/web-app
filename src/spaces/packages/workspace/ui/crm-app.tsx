import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/ui-primitives/ui/tabs";
import { Avatar, AvatarFallback } from "@/ui-primitives/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui-primitives/ui/popover";
import { Button } from "@/ui-primitives/ui/button";
import { Separator } from "@/ui-primitives/ui/separator";
import { Home, Users, Building2, MessageSquare, LogOut } from "lucide-react";
import { useRouter } from "next/router";
import { usePlatformUser } from "@/spaces/platform/contexts/platform-user.context";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import { useAuth } from "@/spaces/identity/identity-auth.context";
import { PeopleView } from "./people/people-view";
import { CompaniesView } from "./companies/companies-view";

export function CrmApp() {
  const { user } = usePlatformUser();
  const { tenant } = usePlatformTenant();
  const { logout } = useAuth();
  const router = useRouter();

  const displayName = user?.displayName || user?.email || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-sm font-semibold truncate">
          {tenant?.name || "SidePanel"}
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-0">
            <div className="p-3">
              <p className="text-sm font-medium truncate">{displayName}</p>
              {user?.email && displayName !== user.email && (
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              )}
            </div>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Tabs defaultValue="home" className="flex flex-col h-full">
        <div className="border-b bg-muted/50 sticky top-0 z-10">
          <TabsList className="w-full flex h-auto bg-transparent border-none p-0 rounded-none">
            <TabsTrigger
              value="home"
              className="flex-1 flex flex-col items-center gap-1 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all"
            >
              <Home className="size-5" />
              <span className="text-[10px] font-semibold">Home</span>
            </TabsTrigger>
            <TabsTrigger
              value="people"
              className="flex-1 flex flex-col items-center gap-1 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all"
            >
              <Users className="size-5" />
              <span className="text-[10px] font-semibold">People</span>
            </TabsTrigger>
            <TabsTrigger
              value="companies"
              className="flex-1 flex flex-col items-center gap-1 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all"
            >
              <Building2 className="size-5" />
              <span className="text-[10px] font-semibold">Companies</span>
            </TabsTrigger>
            <TabsTrigger
              value="comms"
              className="flex-1 flex flex-col items-center gap-1 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all"
            >
              <MessageSquare className="size-5" />
              <span className="text-[10px] font-semibold">Comms</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="home" className="mt-0">
            <h2 className="text-xl font-bold mb-4">Dashboard</h2>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg border">
                <p className="text-sm font-medium">Active Leads</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <div className="p-4 bg-muted rounded-lg border">
                <p className="text-sm font-medium">Revenue This Month</p>
                <p className="text-2xl font-bold">$12,450</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="people" className="mt-0 h-full">
            <PeopleView />
          </TabsContent>

          <TabsContent value="companies" className="mt-0 h-full">
            <CompaniesView />
          </TabsContent>

          <TabsContent value="comms" className="mt-0">
            <h2 className="text-xl font-bold mb-4">Communications</h2>
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-md border">
                <p className="text-sm font-semibold">Email from Alice</p>
                <p className="text-xs text-muted-foreground line-clamp-1">Re: Project update - Hey, just wanted to check in on the status...</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-md border">
                <p className="text-sm font-semibold">Meeting with Bob</p>
                <p className="text-xs text-muted-foreground line-clamp-1">Scheduled for tomorrow at 10:00 AM</p>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

