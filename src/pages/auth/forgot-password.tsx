// biome-ignore assist/source/organizeImports: <explanation>
import ForgotPasswordForm from "@/spaces/identity/ui/form-forgot-password";
import { Logo } from "@/spaces/branding/ui/logo";

const ForgotPasswordPage = () => {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo />
        <ForgotPasswordForm />
      </div>
    </div>
  );
};

ForgotPasswordPage.public = true;
export default ForgotPasswordPage;
