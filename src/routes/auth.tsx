import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { APP_NAME, COLLEGE_EMAIL_DOMAIN, COLLEGE_NAME, isAllowedEmail } from "@/lib/college";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const title = `Sign in — ${APP_NAME}`;
const description = `Sign in with your @${COLLEGE_EMAIL_DOMAIN} email to upload and manage question papers.`;

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function sendLink() {
    const value = email.trim().toLowerCase();
    if (!isAllowedEmail(value)) {
      toast.error(`Use your @${COLLEGE_EMAIL_DOMAIN} email address.`);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEmail(value);
    setSent(true);
    toast.success("Link sent — check your inbox.");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
            {sent ? (
              <MailCheck className="size-6 text-secondary-foreground" />
            ) : (
              <GraduationCap className="size-6 text-secondary-foreground" />
            )}
          </div>
          <CardTitle className="mt-3">{sent ? "Check your email" : "Sign in to PYQ Hub"}</CardTitle>
          <CardDescription>
            {sent
              ? `We sent a sign-in link to ${email}. Open it on this device to continue.`
              : `${COLLEGE_NAME} students only — we'll email you a secure sign-in link.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Didn't see it?</p>
                <p className="mt-1">
                  Check your Spam or Junk folder and mark the message as “Not spam” so future
                  emails land in your inbox. The link expires in one hour.
                </p>
              </div>
              <Button variant="outline" className="w-full" disabled={busy} onClick={() => void sendLink()}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Resend link
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setSent(false);
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void sendLink();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">College email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={`you@${COLLEGE_EMAIL_DOMAIN}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Send sign-in link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
