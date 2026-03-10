"use client";

import { useState, useCallback } from "react";
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
import { Input } from "@/ui-primitives/ui/input";
import { Separator } from "@/ui-primitives/ui/separator";
import {
  LogOut,
  Search,
  Bell,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/router";
import { usePlatformUser } from "@/spaces/platform/contexts/platform-user.context";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import { useAuth } from "@/spaces/identity/identity-auth.context";
import { PeopleView } from "./people/people-view";
import { CompaniesView } from "./companies/companies-view";
import { ActivityFeed } from "./activities/activity-feed";
import { PersonDetail } from "./people/person-detail";
import { CompanyDetail } from "./companies/company-detail";
import { AddActivityMenu } from "./activities/add-activity-menu";
import type { ActivityDTO } from "@/spaces/packages/workspace/types";

type DetailView =
  | { kind: "person"; id: string }
  | { kind: "company"; id: string }
  | null;

export function CrmApp() {
  const { user } = usePlatformUser();
  const { tenant } = usePlatformTenant();
  const { logout } = useAuth();
  const router = useRouter();

  const [detailView, setDetailView] = useState<DetailView>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSelectPerson = useCallback((personId: string) => {
    setDetailView({ kind: "person", id: personId });
  }, []);

  const handleSelectCompany = useCallback((companyId: string) => {
    setDetailView({ kind: "company", id: companyId });
  }, []);

  const handleBack = useCallback(() => {
    setDetailView(null);
  }, []);

  const handleSelectActivity = useCallback((activity: ActivityDTO) => {
    if (activity.person) {
      setDetailView({ kind: "person", id: activity.person.id });
    }
  }, []);

  if (detailView) {
    return (
      <div className="flex flex-col h-full bg-background">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          displayName={displayName}
          initials={initials}
          _tenantName={tenant?.name}
          onLogout={handleLogout}
        />

        <Tabs defaultValue="activities" className="flex flex-col h-full">
          <TabBar />

          <div className="flex-1 overflow-y-auto p-4">
            {detailView.kind === "person" ? (
              <PersonDetail
                personId={detailView.id}
                onBack={handleBack}
                onSelectCompany={handleSelectCompany}
                onSelectActivity={handleSelectActivity}
              />
            ) : (
              <CompanyDetail
                companyId={detailView.id}
                onBack={handleBack}
                onSelectPerson={handleSelectPerson}
                onSelectActivity={handleSelectActivity}
              />
            )}
          </div>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        displayName={displayName}
        initials={initials}
        _tenantName={tenant?.name}
        onLogout={handleLogout}
      />

      <Tabs defaultValue="activities" className="flex flex-col h-full">
        <TabBar />

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="activities" className="mt-0">
            <ActivityFeed
              onSelectActivity={handleSelectActivity}
              onSelectPerson={handleSelectPerson}
              onSelectCompany={handleSelectCompany}
            />
          </TabsContent>

          <TabsContent value="people" className="mt-0 h-full">
            <PeopleView />
          </TabsContent>

          <TabsContent value="companies" className="mt-0 h-full">
            <CompaniesView />
          </TabsContent>
        </div>
      </Tabs>

      <div className="border-t px-4 py-2 flex items-center justify-between bg-background">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-semibold">SP</span>
          <span>SidePanel</span>
        </div>
      </div>
    </div>
  );
}

function Header({
  searchQuery,
  onSearchChange,
  displayName,
  initials,
  onLogout,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  displayName: string;
  initials: string;
  _tenantName?: string;
  onLogout: () => void;
}) {
  return (
    <div className="px-4 py-3 space-y-3 border-b">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, company, or activity"
            className="pl-8 h-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-4 w-4" />
        </Button>
        <AddActivityMenu />
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-0">
            <div className="p-3">
              <p className="text-sm font-medium truncate">{displayName}</p>
            </div>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function TabBar() {
  return (
    <div className="border-b bg-background sticky top-0 z-10">
      <TabsList className="w-full flex h-auto bg-transparent border-none p-0 px-4 gap-1 rounded-none">
        <TabsTrigger
          value="activities"
          className="flex-1 py-2 text-sm font-medium data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-full"
        >
          Activities
        </TabsTrigger>
        <TabsTrigger
          value="people"
          className="flex-1 py-2 text-sm font-medium data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-full"
        >
          People
        </TabsTrigger>
        <TabsTrigger
          value="companies"
          className="flex-1 py-2 text-sm font-medium data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-full"
        >
          Companies
        </TabsTrigger>
        <button
          type="button"
          className="p-2 text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </TabsList>
    </div>
  );
}
