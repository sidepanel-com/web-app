import { GetServerSideProps } from "next";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { CrmApp } from "@/spaces/packages/workspace/ui/crm-app";
import { AppPage } from "@/spaces/platform/ui/layout/app-page";

export default function WrappedAppPage() {
  return (
    <AppPage>
      <div className="fixed inset-0 overflow-hidden bg-background">
        <CrmApp />
      </div>
    </AppPage>
  );
}

// Mark this page as requiring a tenant
(WrappedAppPage as any).requiresTenant = true;

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

