"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";

const SignupPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/login");
  }, [router]);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <p className="text-muted-foreground">Redirecting…</p>
    </div>
  );
};

SignupPage.public = true;
export default SignupPage;
