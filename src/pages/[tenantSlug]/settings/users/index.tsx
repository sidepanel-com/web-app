import { GetServerSideProps } from "next";
import { TenantUsersContainer } from "@/spaces/platform/ui/tenant/user-management/tenant-users-container";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { AppPage } from "@/spaces/platform/ui/layout/app-page";

interface UsersSettingsPageProps {
  tenantSlug: string;
}

export default function UsersSettingsPage({
  tenantSlug,
}: UsersSettingsPageProps) {
  return (
    <AppPage>
      <TenantUsersContainer />
    </AppPage>
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
