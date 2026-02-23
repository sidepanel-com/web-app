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
import { Dialog, DialogContent } from "@/ui-primitives/ui/dialog";
import { Skeleton } from "@/ui-primitives/ui/skeleton";

import { TenantCreateForm } from "@/spaces/platform/ui/tenant/tenant-create-form";

import { usePlatformUser } from "@/spaces/platform/contexts/platform-user.context";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import { saveLastTenantSlug } from "@/spaces/platform/ui/nav-helpers";
import type { Tenant } from "@db/platform/types";

export function AppTenantSwitcher() {
  const { isMobile } = useSidebar();
  const { availableTenants } = usePlatformUser();
  const { tenant, isLoading } = usePlatformTenant();
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
                {isLoading ? (
                  <div className="grid flex-1 gap-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ) : (
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{tenant?.name}</span>
                    <span className="truncate text-xs">
                      {tenant?.subscriptionTier}
                    </span>
                  </div>
                )}
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
              {availableTenants.map((tenant: Tenant, index: number) => (
                <DropdownMenuItem
                  key={tenant.slug}
                  asChild
                  className="gap-2 p-2"
                  onClick={() => saveLastTenantSlug(tenant.slug)}
                >
                  <Link href={`/${tenant.slug}/`}>
                    {tenant.name}
                    {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
                  </Link>
                </DropdownMenuItem>
              ))}
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
