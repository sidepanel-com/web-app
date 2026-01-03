import { GetServerSideProps } from "next";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { AppPage } from "@/spaces/platform/ui/app/app-page";
import TenantSettingsGeneral from "@/spaces/platform/ui/tenant/tenant-settings-general";

export default function DashboardPage() {
  return (
    <>
      <AppPage>
        <TenantSettingsGeneral />
      </AppPage>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createClient(ctx);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log({ session });
  // If user is not logged in, redirect to login
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
