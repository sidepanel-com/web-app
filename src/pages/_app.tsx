// src/pages/_app.tsx
import type { AppProps } from "next/app";
import { useRouter } from "next/router";

import { BrandingThemeProvider } from "@/spaces/branding/branding-theme.context";
import {
  IdentityAuthProvider,
  useAuth,
} from "@/spaces/identity/identity-auth.context";
import { PlatformUserProvider } from "@/spaces/platform/contexts/platform-user.context";
import { PlatformTenantProvider } from "@/spaces/platform/contexts/platform-tenant.context";

import { NoTenantSelected } from "@/spaces/platform/ui/entry/no-tenant-selected";
import "@/styles/globals.css";

function AppGuard({
  children,
  isPublic,
}: {
  children: React.ReactNode;
  isPublic: boolean;
}) {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  if (!isPublic) {
    if (isLoading) return null;
    if (!session) {
      router.replace("/auth/login");
      return null;
    }
  }

  return <>{children}</>;
}

function TenantBoundary({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const tenantSlug = router.query.tenantSlug as string | undefined;
  const requiresTenant = (Component as any).requiresTenant === true;

  if (requiresTenant && !tenantSlug) {
    return <NoTenantSelected />;
  }

  return (
    <PlatformTenantProvider tenantSlug={tenantSlug as string}>
      <Component {...pageProps} />
    </PlatformTenantProvider>
  );
}

export default function App(props: AppProps) {
  const isPublic = (props.Component as any).public === true;

  return (
    <BrandingThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <IdentityAuthProvider>
        <PlatformUserProvider>
          <AppGuard isPublic={isPublic}>
            <TenantBoundary {...props} />
          </AppGuard>
        </PlatformUserProvider>
      </IdentityAuthProvider>
    </BrandingThemeProvider>
  );
}
