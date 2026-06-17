import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/finexa/MarketingShell";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth/register")({
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
    const result = await signup(username, email, password, name);
    if (result.success) {
      navigate({ to: "/onboarding" });
    } else {
      setError(result.error || "Registration failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="60 seconds. Then your money makes sense.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}
        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">Full name</div>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Morgan"
            className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
          />
        </label>
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
          <div className="text-xs text-muted-foreground mb-1">Password</div>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
          />
        </label>
        <button
          disabled={loading}
          className="w-full rounded-lg bg-cta py-2.5 text-sm font-medium text-cta-foreground disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
        <div className="text-center text-xs text-muted-foreground">
          Already have one?{" "}
          <Link to="/auth/login" className="text-foreground hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
