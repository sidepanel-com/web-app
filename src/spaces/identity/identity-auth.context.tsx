import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/spaces/identity/supabase.browser-client";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function IdentityAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(
    null,
  );
  if (!supabaseRef.current) {
    supabaseRef.current = createBrowserClient();
  }
  const supabase = supabaseRef.current;

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(
        ({
          data,
          error,
        }: {
          data: { session: Session | null };
          error: Error | null;
        }) => {
          if (!mounted) return;
          if (error) setError(error);
          setSession(data.session);
          setIsLoading(false);
        },
      );

    const { data } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null): void => {
        setSession(session);
        setIsLoading(false);
      },
    );

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const logout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) setError(error);
    setSession(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
