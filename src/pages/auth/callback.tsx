import type { GetServerSideProps } from "next";
import { createClient } from "@/spaces/identity/supabase.server-props";
import Link from "next/link";

type Props = {
  error?: string | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const { query } = context;
  const code =
    typeof query.code === "string" ? query.code : Array.isArray(query.code) ? query.code[0] : null;
  const next =
    typeof query.next === "string" ? query.next : Array.isArray(query.next) ? query.next[0] : null;
  const redirectTo = next ?? "/";

  if (!code) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }

  const supabase = createClient(context);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = `/auth/login?error=${encodeURIComponent(error.message)}`;
    return { redirect: { destination: loginUrl, permanent: false } };
  }

  return { redirect: { destination: redirectTo, permanent: false } };
};

const CallbackPage = ({ error }: Props) => {
  if (error) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="text-destructive text-center">
          <p className="font-medium">Sign in failed</p>
          <p className="text-muted-foreground mt-1 text-sm">{error}</p>
          <Link
            href="/auth/login"
            className="text-primary mt-4 inline-block text-sm underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
};

CallbackPage.public = true;

export default CallbackPage;
