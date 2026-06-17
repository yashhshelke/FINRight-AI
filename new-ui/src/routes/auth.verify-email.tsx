import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { CheckCircle2, Loader2, Mail, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/auth/verify-email")({
  component: VerifyEmail,
});

function VerifyEmail() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [verified, setVerified] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: (t: string) => apiFetch<any>("/auth/verify-email/", {
      method: "POST",
      body: JSON.stringify({ token: t }),
    }, false),
    onSuccess: () => setVerified(true),
  });

  const resendMutation = useMutation({
    mutationFn: () => apiFetch<any>("/auth/send-verification-email/", {
      method: "POST",
    }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    verifyMutation.mutate(token.trim());
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-brand-light to-brand grid place-items-center">
            <Mail className="h-6 w-6 text-background" />
          </div>
          <h1 className="text-display text-2xl">Verify your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the verification token sent to your email address.
          </p>
        </div>

        {verified ? (
          <div className="rounded-2xl border border-success/30 bg-success/10 p-6 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto text-success mb-3" />
            <h2 className="text-lg font-medium text-success">Email Verified</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Your email has been verified successfully.
            </p>
            <button
              onClick={() => navigate({ to: "/auth/login" })}
              className="mt-4 w-full rounded-lg bg-cta py-2.5 text-sm font-medium text-cta-foreground"
            >
              Continue to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Verification Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your token here"
                className="w-full rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm outline-none focus:border-brand-light"
                autoFocus
              />
            </div>

            {verifyMutation.isError && (
              <div className="flex items-center gap-2 rounded-lg bg-error/10 border border-error/20 px-3 py-2 text-xs text-error">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {(verifyMutation.error as Error)?.message || "Invalid or expired token."}
              </div>
            )}

            <button
              type="submit"
              disabled={verifyMutation.isPending || !token.trim()}
              className="w-full rounded-lg bg-cta py-2.5 text-sm font-medium text-cta-foreground disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifyMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
              ) : (
                "Verify Email"
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {resendMutation.isPending ? "Sending..." : resendMutation.isSuccess ? "Sent!" : "Didn't receive it? Resend"}
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <button
            onClick={() => navigate({ to: "/auth/login" })}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
