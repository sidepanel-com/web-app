import ResetPasswordForm from "@/spaces/identity/ui/form-reset-password";
import { Logo } from "@/spaces/branding/ui/logo";

const ResetPasswordPage = () => {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo />
        <ResetPasswordForm />
      </div>
    </div>
  );
};

ResetPasswordPage.public = true;
export default ResetPasswordPage;
