// src/pages/_app.tsx
import type { AppProps } from "next/app";
import { useRouter } from "next/router";

import { BrandingThemeProvider } from "@/spaces/branding/branding-theme.context";
import {
  IdentityAuthProvider,
  useAuth,
} from "@/spaces/identity/identity-auth.context";
import { PlatformUserProvider } from "@/spaces/platform/client/platform-user.context";
import { PlatformTenantProvider } from "@/spaces/platform/client/platform-tenant.context";

import "@/styles/globals.css";

function AppGuard({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  const isPublic = (Component as any).public === true;

  if (!isPublic) {
    if (isLoading) return null;
    if (!session) {
      router.replace("/auth/login");
      return null;
    }
  }

  return <Component {...pageProps} />;
}

function TenantBoundary({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const tenantId = router.query.tenantId as string | undefined;
  const requiresTenant = (Component as any).requiresTenant === true;

  if (requiresTenant && !tenantId) {
    return null; // or redirect to tenant picker
  }

  return (
    <PlatformTenantProvider tenantId={tenantId as string}>
      <Component {...pageProps} />
    </PlatformTenantProvider>
  );
}

export default function App(props: AppProps) {
  return (
    <BrandingThemeProvider>
      <IdentityAuthProvider>
        <PlatformUserProvider>
          <AppGuard {...props}>
            <TenantBoundary {...props} />
          </AppGuard>
        </PlatformUserProvider>
      </IdentityAuthProvider>
    </BrandingThemeProvider>
  );
}
