import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createBrowserClient } from '@/spaces/identity/supabase.browser-client';
import { Button } from '@/ui-primitives/ui/button';
import { Input } from '@/ui-primitives/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/ui-primitives/ui/card';
import { toast } from 'sonner';

function AcceptInvitationPage() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabaseBrowserClient = createBrowserClient();

  const [hasSession, setHasSession] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);


  useEffect(() => {
    const initializeInvitation = async () => {
      // 1. Check if we have the tokens in the hash (#access_token=...)
      const hash = window.location.hash;

      if (hash && hash.includes("access_token=")) {
        // Parse the hash into an object
        const params = new URLSearchParams(hash.substring(1)); // skip the '#'
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          console.log("Manually forcing session from URL tokens...");

          // 2. Force the client to use these tokens
          const { data, error } = await supabaseBrowserClient.auth.setSession({
            access_token,
            refresh_token,
          });

          if (data.session) {
            console.log("Session successfully forced!", data.session.user.email);
            setHasSession(true);
          } else if (error) {
            console.error("Failed to force session:", error.message);
          }
        }
      } else {
        // If no hash, check if there's already a session existing
        const { data: { session } } = await supabaseBrowserClient.auth.getSession();
        if (session) setHasSession(true);
      }

      setIsInitializing(false);
    };

    initializeInvitation();
  }, [supabaseBrowserClient]);
  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Missing invitation token");
    setLoading(true);

    try {
      // 1. Set the user's password for future logins
      const { error: authError } = await supabaseBrowserClient.auth.updateUser({ password });
      if (authError) throw authError;

      // 2. Call the API to process the invitation token
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to join team');

      toast.success('Account setup complete! Welcome to the team.');

      // 3. Send them to the home page to select their new tenant
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) {
    return <div>Initializing...</div>;
  }

  if (!hasSession) {
    return <div>No session found</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Finalize Your Account</CardTitle>
          <CardDescription className="text-center">
            You've been invited! Set a password to finish joining the team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCompleteSetup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="password"
              >
                New Password
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a secure password"
                minLength={6}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading || !token}>
              {loading ? 'Setting up...' : 'Join Team'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

AcceptInvitationPage.public = true;
export default AcceptInvitationPage;