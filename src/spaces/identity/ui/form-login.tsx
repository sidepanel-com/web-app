"use client";

import { cn } from "@/ui-primitives/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui-primitives/ui/card";
import { createBrowserClient } from "@/spaces/identity/supabase.browser-client";
import { Alert, AlertDescription, AlertTitle } from "@/ui-primitives/ui/alert";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter as usePagesRouter } from "next/router";
import { ButtonOAuth } from "./button-google-auth";

export default function FormLogin({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const pagesRouter = usePagesRouter();
  const supabase = createBrowserClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = pagesRouter.query?.error;
    const errorFromUrl =
      typeof q === "string" ? q : Array.isArray(q) ? q[0] : null;
    if (errorFromUrl) {
      setError(decodeURIComponent(errorFromUrl));
    }
  }, [pagesRouter.query]);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      }
    };
    checkSession();
  }, [router, supabase.auth]);

  async function signInWithGoogle() {
    setIsLoading(true);
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) {
      setError(oauthError.message);
    }
    setIsLoading(false);
  }

  async function signInWithMicrosoft() {
    setIsLoading(true);
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { redirectTo },
    });
    if (oauthError) {
      setError(oauthError.message);
    }
    setIsLoading(false);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>
            Continue with Google or Microsoft to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sign in failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <ButtonOAuth
              provider="google"
              label="Continue with Google"
              onClick={signInWithGoogle}
              isLoading={isLoading}
            />
            <ButtonOAuth
              provider="azure"
              label="Continue with Microsoft"
              onClick={signInWithMicrosoft}
              isLoading={isLoading}
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our{" "}
        <Link
          href="/terms-of-service"
          className="underline underline-offset-4 hover:text-primary"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy-policy"
          className="underline underline-offset-4 hover:text-primary"
        >
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
