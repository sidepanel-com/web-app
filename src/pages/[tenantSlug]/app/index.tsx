import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { AppPage } from "@/spaces/platform/ui/layout/app-page";
import { MobileDevice } from "@/spaces/product/ui/mobile-device";

export default function AppDashboardPage() {
  const router = useRouter();
  const tenantSlug = router.query.tenantSlug as string;

  return (
    <AppPage>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <MobileDevice>
          <iframe src={`${process.env.NEXT_PUBLIC_SITE_URL}/${tenantSlug}/wrapped`}
            title="Wrapped App" className="w-full h-full" />
        </MobileDevice>
      </div>
    </AppPage>
  );
}

// Mark this page as requiring a tenant
AppDashboardPage.requiresTenant = true;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
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

  return {
    props: {},
  };
};

