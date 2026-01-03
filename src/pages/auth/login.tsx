import FormLogin from "@/spaces/identity/ui/form-login";
import { Logo } from "@/spaces/branding/ui/logo";

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo />
        <FormLogin />
      </div>
    </div>
  );
}
