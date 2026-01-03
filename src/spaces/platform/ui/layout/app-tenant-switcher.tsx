"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/ui-primitives/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/ui-primitives/ui/sidebar";
import { Dialog, DialogContent } from "../ui/dialog";

import { TenantCreateForm } from "@/components/tenant/tenant-create-form";
import { Tables } from "@/types/database.types";
import { useClientUserSDK } from "@/lib/contexts/client-user-sdk.context";
import { useClientTenantSDK } from "@/lib/contexts/client-tenant-sdk.context";

export function AppTenantSwitcher() {
  const { isMobile } = useSidebar();
  const { availableTenants } = useClientUserSDK();
  const { tenant } = useClientTenantSDK();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{tenant?.name}</span>
                  <span className="truncate text-xs">
                    {tenant?.subscription_tier}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Tenants
              </DropdownMenuLabel>
              {availableTenants.map(
                (tenant: Tables<"tenants">, index: number) => (
                  <DropdownMenuItem
                    key={tenant.slug}
                    asChild
                    className="gap-2 p-2"
                  >
                    <Link href={`/${tenant.slug}/dashboard`}>
                      {tenant.name}
                      {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
                    </Link>
                  </DropdownMenuItem>
                ),
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setIsDialogOpen(true)}
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Add tenant
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DialogContent className=" p-0 border-none" showCloseButton={false}>
            <TenantCreateForm onCancel={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
