"use client";

import * as React from "react";
import { Settings } from "lucide-react";

import { AppNavSection } from "./app-nav-section";
import { AppTenantSwitcher } from "./app-tenant-switcher";
import { AppNavUser } from "./app-nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/ui-primitives/ui/sidebar";
import { productNavigation } from "@/spaces/product/navigation";

// This is sample data.
const data = {
  tenants: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
        {
          title: "Team",
          url: "/settings/users",
        },
        {
          title: "Billing",
          url: "/settings/billing",
        },
        {
          title: "Limits",
          url: "/settings/limits",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppTenantSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {productNavigation.map((section) => (
          <AppNavSection
            key={section.title}
            title={section.title}
            items={section.items}
          />
        ))}
        <AppNavSection title="Tenants" items={data.tenants} />
      </SidebarContent>
      <SidebarFooter>
        <AppNavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
