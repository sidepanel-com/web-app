import type { GetServerSideProps } from "next";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { AppPage } from "@/spaces/platform/ui/layout/app-page";
import { PackagesSettings } from "@/spaces/packages/workspace/ui/settings/packages-settings";

export default function PackagesSettingsPage() {
  return (
    <AppPage>
      <PackagesSettings />
    </AppPage>
  );
}

PackagesSettingsPage.requiresTenant = true;

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
