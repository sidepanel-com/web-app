import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { AppPage } from "@/spaces/platform/ui/layout/app-page";
import { MobileDevice } from "@/spaces/packages/workspace/ui/mobile-device";

type Props = { siteOrigin: string };

export default function AppDashboardPage({ siteOrigin }: Props) {
  const router = useRouter();
  const tenantSlug = router.query.tenantSlug as string;

  return (
    <AppPage>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <MobileDevice>
          <iframe
            src={`${siteOrigin}/${tenantSlug}/wrapped`}
            title="Wrapped App"
            className="w-full h-full"
          />
        </MobileDevice>
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

