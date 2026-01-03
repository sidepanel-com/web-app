"use client";

import { useRouter } from "next/router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/ui-primitives/ui/breadcrumb";
import { useClientTenantSDK } from "@/lib/contexts/client-tenant-sdk.context";

interface BreadcrumbConfig {
  title: string;
  href?: string;
  isActive?: boolean;
}

export function AppNavBreadcrumbs() {
  const router = useRouter();
  const { tenant } = useClientTenantSDK();
  const { tenantSlug } = router.query;

  // Static tenant menu items that appear for all tenants
  const staticTenantMenu = [
    { title: "Dashboard", href: `/${tenantSlug}/dashboard` },
    { title: "Settings", href: `/${tenantSlug}/settings` },
  ];

  // Get configured menu from tenant settings (placeholder for now)
  // const configuredMenu = tenant?.menuConfig || []

  // Use static menu items for now
  const allMenuItems = staticTenantMenu;

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (): BreadcrumbConfig[] => {
    const pathSegments = router.asPath.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbConfig[] = [];

    // Add tenant root
    if (tenantSlug) {
      breadcrumbs.push({
        title: tenant?.name || String(tenantSlug),
        href: `/${tenantSlug}/dashboard`,
      });
    }

    // Process remaining path segments
    for (let i = 1; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const isLast = i === pathSegments.length - 1;

      // Find matching menu item
      const menuItem = allMenuItems.find((item) =>
        item.href?.includes(segment),
      );

      breadcrumbs.push({
        title:
          menuItem?.title || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : `/${pathSegments.slice(0, i + 1).join("/")}`,
        isActive: isLast,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {breadcrumb.isActive || !breadcrumb.href ? (
                <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={breadcrumb.href}>
                  {breadcrumb.title}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
