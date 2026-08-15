import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { APP_NAME, COLLEGE_EMAIL_DOMAIN, COLLEGE_NAME, isCollegeEmail } from "@/lib/college";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    const value = email.trim().toLowerCase();
    if (!isCollegeEmail(value)) {
      toast.error(`Use your @${COLLEGE_EMAIL_DOMAIN} email address.`);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEmail(value);
    setStep("otp");
    toast.success("Code sent — check your college inbox.");
  }

  async function verifyCode(value: string) {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: value, type: "email" });
    setBusy(false);
    if (error) {
      toast.error("That code isn't valid or has expired.");
      setCode("");
      return;
    }
    toast.success("You're signed in.");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
            {step === "email" ? (
              <GraduationCap className="size-6 text-secondary-foreground" />
            ) : (
              <MailCheck className="size-6 text-secondary-foreground" />
            )}
          </div>
          <CardTitle className="mt-3">
            {step === "email" ? "Sign in to PYQ Hub" : "Enter your code"}
          </CardTitle>
          <CardDescription>
            {step === "email"
              ? `${COLLEGE_NAME} students only — we'll email you a 6-digit code.`
              : `We sent a 6-digit code to ${email}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" ? (
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
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Send code
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => {
                    setCode(value);
                    if (value.length === 6) void verifyCode(value);
                  }}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {busy && (
                <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Verifying…
                </p>
              )}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("email");
                  setCode("");
                }}
              >
                Use a different email
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
