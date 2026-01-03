export default function BlockTerms() {
  return (
    <div className="text-muted-foreground text-center text-xs text-balance">
      By continuing, you agree to our{" "}
      <a
        href="/terms"
        className="underline underline-offset-4 hover:text-primary"
      >
        Terms of Service
      </a>{" "}
      and{" "}
      <a
        href="/privacy"
        className="underline underline-offset-4 hover:text-primary"
      >
        Privacy Policy
      </a>
      .
    </div>
  );
}
