"use client";

import { useMemo } from "react";
import { useAuth } from "@/spaces/identity/identity-auth.context";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import {
  createProductClientSDK,
  type ProductClientSDK,
} from "@/spaces/packages/workspace/client-sdk";

export function useProductSdk(): ProductClientSDK | null {
  const { session } = useAuth();
  const { tenant } = usePlatformTenant();

  const sdk = useMemo(() => {
    if (!session?.access_token || !tenant?.slug) {
      return null;
    }

    return createProductClientSDK(
      {
        baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
        accessToken: session.access_token,
      },
      tenant.slug
    );
  }, [session?.access_token, tenant?.slug]);

  return sdk;
}
