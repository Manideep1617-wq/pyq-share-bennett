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
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function sendCode() {
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
    setCode("");
    setSent(true);
    toast.success("Code sent — check your email.");
  }

  async function verify() {
    const token = code.replace(/\D/g, "");
    if (token.length < 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setVerifying(false);
    if (error) {
      toast.error(error.message || "That code isn't valid or has expired.");
      return;
    }
    toast.success(`Welcome to ${APP_NAME}!`);
    navigate({ to: "/dashboard", replace: true });
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
          <CardTitle className="mt-3">{sent ? "Enter your code" : "Sign in to PYQ Hub"}</CardTitle>
          <CardDescription>
            {sent
              ? `We emailed a 6-digit code to ${email}. Enter it below to sign in.`
              : `${COLLEGE_NAME} students only — we'll email you a 6-digit sign-in code.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void verify();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="code">6-digit code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg tracking-[0.4em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={verifying}>
                {verifying ? <Loader2 className="size-4 animate-spin" /> : null} Verify & sign in
              </Button>
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Didn't get it?</p>
                <p className="mt-1">
                  Check your Spam or Junk folder and mark the message as “Not spam”. The code
                  expires in one hour. The email may also contain a sign-in link — either works.
                </p>
              </div>
              <Button variant="outline" className="w-full" disabled={busy} onClick={() => void sendCode()} type="button">
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Resend code
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                type="button"
                onClick={() => {
                  setSent(false);
                  setCode("");
                }}
              >
                Use a different email
              </Button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void sendCode();
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
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Send sign-in code
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
