import { GetServerSideProps } from "next";
import { InvitationsList } from "@/spaces/platform/ui/tenant/invitations/invitations-list";
import { Button } from "@/spaces/platform/ui/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

interface InvitationsPageProps {
  tenantSlug: string;
}

export default function InvitationsPage({ tenantSlug }: InvitationsPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${tenantSlug}/settings/users`}>
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Team
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Pending Invitations
          </h1>
          <p className="text-muted-foreground">
            Manage pending team invitations
          </p>
        </div>
      </div>

      <InvitationsList />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { tenantSlug } = context.params!;

  return {
    props: {
      tenantSlug: tenantSlug as string,
    },
  };
};
