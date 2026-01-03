"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/ui-primitives/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/ui-primitives/ui/sidebar";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import { type NavItem } from "../nav-types";

const MENU_STATE_STORAGE_KEY = "sidebar_menu_state";

function getMenuStateKey(sectionTitle: string, itemTitle: string): string {
  return `${MENU_STATE_STORAGE_KEY}_${sectionTitle}_${itemTitle}`;
}

function getStoredMenuState(
  sectionTitle: string,
  itemTitle: string,
  defaultValue: boolean,
): boolean {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = localStorage.getItem(
      getMenuStateKey(sectionTitle, itemTitle),
    );
    return stored !== null ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStoredMenuState(
  sectionTitle: string,
  itemTitle: string,
  isOpen: boolean,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getMenuStateKey(sectionTitle, itemTitle),
      JSON.stringify(isOpen),
    );
  } catch {
    // Ignore localStorage errors
  }
}

export function AppNavSection({
  title,
  items,
}: {
  title: string;
  items: NavItem[];
}) {
  const { tenant } = usePlatformTenant();
  const tenantSlug = tenant?.slug;

  // Initialize state for each menu item
  const [menuStates, setMenuStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load initial state from localStorage
    const initialState: Record<string, boolean> = {};
    items.forEach((item) => {
      const key = item.title;
      initialState[key] = getStoredMenuState(
        title,
        item.title,
        item.isActive ?? false,
      );
    });
    setMenuStates(initialState);
  }, [title, items]);

  const handleOpenChange = (itemTitle: string, isOpen: boolean) => {
    setMenuStates((prev) => ({ ...prev, [itemTitle]: isOpen }));
    setStoredMenuState(title, itemTitle, isOpen);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;

          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={`/${tenantSlug}${item.url}`}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          const isOpen = menuStates[item.title] ?? item.isActive ?? false;
          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(open) => handleOpenChange(item.title, open)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={`/${tenantSlug}${subItem.url}`}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
