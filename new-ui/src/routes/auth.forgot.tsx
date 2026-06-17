import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/finexa/MarketingShell";
import { useState } from "react";
import { AuthAPI } from "@/lib/api/auth";

export const Route = createFileRoute("/auth/forgot")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await AuthAPI.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" subtitle="Password reset link sent.">
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly.
        </div>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/auth/login" className="text-foreground hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password" subtitle="We'll send you a link.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}
        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">Email</div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
          />
        </label>
        <button
          disabled={loading}
          className="w-full rounded-lg bg-cta py-2.5 text-sm font-medium text-cta-foreground disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
        <div className="text-center text-xs text-muted-foreground">
          <Link to="/auth/login" className="text-foreground hover:underline">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
