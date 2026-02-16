import { Button } from "@/ui-primitives/ui/button";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
    <title>Google</title>
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
      fill="currentColor"
    />
  </svg>
);

const MicrosoftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
    <title>Microsoft</title>
    <path
      d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"
      fill="currentColor"
    />
  </svg>
);

export type OAuthProvider = "google" | "azure";

interface ButtonOAuthProps {
  provider: OAuthProvider;
  label: string;
  onClick: () => void;
  isLoading: boolean;
}

export function ButtonOAuth({
  provider,
  label,
  onClick,
  isLoading,
}: ButtonOAuthProps) {
  const Icon = provider === "google" ? GoogleIcon : MicrosoftIcon;

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={isLoading}
    >
      <Icon />
      {isLoading ? "Authenticating..." : label}
    </Button>
  );
}

export interface ButtonGoogleAuthProps {
  text: string;
  onClick: () => void;
  isLoading: boolean;
}

export default function ButtonGoogleAuth({
  text,
  onClick,
  isLoading,
}: ButtonGoogleAuthProps) {
  return (
    <ButtonOAuth
      provider="google"
      label={text}
      onClick={onClick}
      isLoading={isLoading}
    />
  );
}
