"use client";

import type * as React from "react";
import { Plug2, Settings } from "lucide-react";

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
import { productNavigation } from "@/spaces/packages/workspace/navigation";

// This is sample data.
const data = {
  navItems: [
    {
      title: "Connections",
      url: "/connections",
      icon: Plug2,
    },
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
        <AppNavSection title="Organization" items={data.navItems} />
      </SidebarContent>
      <SidebarFooter>
        <AppNavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
