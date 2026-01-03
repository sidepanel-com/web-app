import { GetServerSideProps } from "next";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { AppPage } from "@/spaces/platform/ui/app/app-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/spaces/platform/ui/ui/card";

export default function LimitsSettingsPage() {
  return (
    <AppPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Limits</h1>
          <p className="text-muted-foreground">
            View and manage your tenant&apos;s usage limits and quotas.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usage Limits</CardTitle>
            <CardDescription>
              Limits functionality is not yet implemented.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This page will be available once limits and quotas features are
              added to the system.
            </p>
          </CardContent>
        </Card>
      </div>
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
