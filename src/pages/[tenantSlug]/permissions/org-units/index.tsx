import type { GetServerSideProps } from "next";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { AppPage } from "@/spaces/platform/ui/layout/app-page";
import { OrgUnitsView } from "@/spaces/packages/workspace/ui/permissions/org-units-view";

export default function OrgUnitsPage() {
  return (
    <AppPage>
      <OrgUnitsView />
    </AppPage>
  );
}

OrgUnitsPage.requiresTenant = true;

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
