import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/finexa/MarketingShell";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      navigate({ to: "/app" });
    } else {
      setError(result.error || "Invalid email or password");
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your financial OS.">
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
        <label className="block">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Password</span>
            <Link to="/auth/forgot" className="hover:text-foreground">
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
          />
        </label>
        <button
          disabled={loading}
          className="w-full rounded-lg bg-cta py-2.5 text-sm font-medium text-cta-foreground disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <div className="text-center text-xs text-muted-foreground">
          New here?{" "}
          <Link to="/auth/register" className="text-foreground hover:underline">
            Create an account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
