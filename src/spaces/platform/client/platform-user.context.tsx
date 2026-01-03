"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/spaces/identity/identity-auth.context";

interface PlatformUser {
  id: string;
  email: string;
  displayName?: string;
  timezone?: string;
}

interface UserContextType {
  user: PlatformUser | null;
  isLoading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function PlatformUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading: authLoading } = useAuth();

  const [user, setUser] = useState<PlatformUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) return;

    if (!session) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    async function loadUser() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/platform/user", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to load platform user");
        }

        const data = await res.json();
        if (!cancelled) {
          setUser(data);
        }
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [authLoading, session]);

  return (
    <UserContext.Provider value={{ user, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
