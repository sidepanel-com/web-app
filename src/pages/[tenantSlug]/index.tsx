import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { AppPage } from "@/spaces/platform/ui/layout/app-page";
import { MobileDevice } from "@/spaces/packages/workspace/ui/mobile-device";
import { useEnabledPackages } from "@/spaces/platform/hooks/use-enabled-packages";
import { Package } from "lucide-react";

type Props = { siteOrigin: string };

export default function AppDashboardPage({ siteOrigin }: Props) {
  const router = useRouter();
  const tenantSlug = router.query.tenantSlug as string;
  const enabledPackageIds = useEnabledPackages();

  if (enabledPackageIds === null) {
    return <AppPage><div /></AppPage>;
  }

  const workspaceEnabled = enabledPackageIds.includes("workspace");

  return (
    <AppPage>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        {workspaceEnabled ? (
          <MobileDevice>
            <iframe
              src={`${siteOrigin}/${tenantSlug}/wrapped`}
              title="Wrapped App"
              className="w-full h-full"
            />
          </MobileDevice>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="rounded-full bg-muted p-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No active packages</h2>
            <p className="text-muted-foreground">
              Enable a package in{" "}
              <a
                href={`/${tenantSlug}/settings/packages`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Settings &rarr; Packages
              </a>{" "}
              to get started.
            </p>
          </div>
        )}
      </div>
    </AppPage>
  );
}

// Mark this page as requiring a tenant
AppDashboardPage.requiresTenant = true;

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = createClient(ctx);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  const host = ctx.req.headers.host ?? "localhost:3000";
  const proto =
    ctx.req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const siteOrigin = `${proto}://${host}`;

  return {
    props: { siteOrigin },
  };
};

