import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-primitives/ui/tabs";
import { Home, Users, Building2, MessageSquare } from "lucide-react";

export function CrmApp() {
  return (
    <div className="flex flex-col h-full bg-background">
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

          <TabsContent value="people" className="mt-0">
            <h2 className="text-xl font-bold mb-4">People</h2>
            <div className="space-y-2">
              {['Alice Johnson', 'Bob Smith', 'Charlie Brown'].map(name => (
                <div key={name} className="p-3 bg-muted/50 rounded-md border flex items-center justify-between">
                  <span>{name}</span>
                  <button className="text-xs text-primary" type="button">View</button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="companies" className="mt-0">
            <h2 className="text-xl font-bold mb-4">Companies</h2>
            <div className="space-y-2">
              {['Acme Corp', 'Globex', 'Soylent Corp'].map(name => (
                <div key={name} className="p-3 bg-muted/50 rounded-md border flex items-center justify-between">
                  <span>{name}</span>
                  <button className="text-xs text-primary" type="button">View</button>
                </div>
              ))}
            </div>
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

