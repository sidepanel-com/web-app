import type { GetServerSideProps } from "next";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { AppPage } from "@/spaces/platform/ui/layout/app-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-primitives/ui/tabs";
import { ApiKeysSettings } from "@/spaces/product/ui/api-keys-settings";
import { BookOpen, Key } from "lucide-react";
import { ApiDocsView } from "@/spaces/product/ui/api-docs-view";

export default function ApiPage() {
  return (
    <AppPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">API</h1>
          <p className="text-muted-foreground">
            Documentation and API keys for programmatic access.
          </p>
        </div>

        <Tabs defaultValue="docs" className="w-full">
          <TabsList className="grid w-full max-w-[240px] grid-cols-2">
            <TabsTrigger value="docs" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Docs
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-2">
              <Key className="h-4 w-4" />
              Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="docs" className="mt-6">
            <div className="min-h-[480px]">
              <ApiDocsView />
            </div>
          </TabsContent>

          <TabsContent value="keys" className="mt-6">
            <ApiKeysSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppPage>
  );
}

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
