import type { GetServerSideProps } from "next";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { AppPage } from "@/spaces/platform/ui/layout/app-page";
import { MembersView } from "@/spaces/packages/workspace/ui/permissions/members-view";

export default function MembersPage() {
  return (
    <AppPage>
      <MembersView />
    </AppPage>
  );
}

MembersPage.requiresTenant = true;

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
