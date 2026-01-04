import { GetServerSideProps } from "next";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { AppPage } from "@/spaces/platform/ui/layout/app-page";
import { MobileDevice } from "@/spaces/product/ui/mobile-device";
import { CrmApp } from "@/spaces/product/ui/crm-app";

export default function AppDashboardPage() {
  return (
    <AppPage>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <MobileDevice>
          <CrmApp />
        </MobileDevice>
      </div>
    </AppPage>
  );
}

// Mark this page as requiring a tenant
(AppDashboardPage as any).requiresTenant = true;

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

