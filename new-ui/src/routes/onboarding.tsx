import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { AuthAPI } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/finexa/ProtectedRoute";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <ProtectedRoute>
      <Onboarding />
    </ProtectedRoute>
  );
}

const STEPS = ["Income", "Goals", "Savings", "Profile", "Done"] as const;

const GOAL_OPTIONS = ["Emergency", "Travel", "House", "Car", "Investments", "Education", "Wedding", "Retirement"];
const PROFILE_OPTIONS = ["Frugal", "Balanced", "Spender", "Impulsive"];

function Onboarding() {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    income: 50000,
    goals: ["Emergency"] as string[],
    savings: 5000,
    profile: "Balanced",
  });

  const last = step === STEPS.length - 1;

  async function handleFinish() {
    setLoading(true);
    setError("");
    try {
      const spendingMap: Record<string, number> = {
        Emergency: Math.round(data.savings * 0.5),
        Travel: Math.round(data.savings * 0.2),
        House: Math.round(data.savings * 0.3),
      };
      const spending = data.goals.slice(0, 3).map((g) => ({
        category: g,
        amount: spendingMap[g] || Math.round(data.savings / data.goals.length),
        description: `${g} savings`,
      }));
      await AuthAPI.onboarding({
        first_name: user?.first_name || user?.username || "User",
        monthly_income: data.income,
        spending,
      });
      await refreshUser();
      navigate({ to: "/app" });
    } catch (err: any) {
      setError(err.message || "Setup failed, please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-brand/15 blur-[120px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
        {/* Progress */}
        <div className="mb-10 flex items-center gap-2 text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-brand-light" : "bg-surface"}`} />
              <span className={i === step ? "text-foreground" : ""}>{s}</span>
            </div>
          ))}
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && (
                <Step title="What's your monthly income?" subtitle="We'll never share it.">
                  <NumInput v={data.income} onChange={(v) => setData({ ...data, income: v })} prefix="₹" />
                </Step>
              )}
              {step === 1 && (
                <Step title="What are you saving for?" subtitle="Pick all that apply.">
                  <Chips
                    options={GOAL_OPTIONS}
                    selected={data.goals}
                    onToggle={(o) =>
                      setData({
                        ...data,
                        goals: data.goals.includes(o)
                          ? data.goals.filter((x) => x !== o)
                          : [...data.goals, o],
                      })
                    }
                  />
                </Step>
              )}
              {step === 2 && (
                <Step title="Monthly savings target?" subtitle="A number that feels brave but possible.">
                  <NumInput v={data.savings} onChange={(v) => setData({ ...data, savings: v })} prefix="₹" />
                </Step>
              )}
              {step === 3 && (
                <Step title="Your spending personality?" subtitle="We'll calibrate insights.">
                  <Chips
                    options={PROFILE_OPTIONS}
                    selected={[data.profile]}
                    onToggle={(o) => setData({ ...data, profile: o })}
                  />
                </Step>
              )}
              {step === 4 && (
                <Step title="You're all set!" subtitle="Let's get your financial picture in focus.">
                  <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-3 text-sm">
                    <Row label="Monthly income" value={`₹${data.income.toLocaleString("en-IN")}`} />
                    <Row label="Savings target" value={`₹${data.savings.toLocaleString("en-IN")}/mo`} />
                    <Row label="Goals" value={data.goals.join(", ")} />
                    <Row label="Profile" value={data.profile} />
                  </div>
                  {error && (
                    <p className="mt-3 text-sm text-error">{error}</p>
                  )}
                </Step>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            disabled={loading}
            onClick={() => (last ? handleFinish() : setStep((s) => s + 1))}
            className="inline-flex items-center gap-2 rounded-full bg-cta px-5 py-2.5 text-sm font-medium text-cta-foreground disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Setting up…</>
            ) : last ? (
              <><Check className="h-4 w-4" /> Enter Finexa</>
            ) : (
              <>Continue <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-display text-4xl md:text-5xl tracking-tight text-balance">{title}</h1>
      <p className="mt-3 text-muted-foreground">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function NumInput({ v, onChange, prefix }: { v: number; onChange: (v: number) => void; prefix?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-5 py-5">
      {prefix && <span className="text-display text-3xl text-muted-foreground">{prefix}</span>}
      <input
        type="number"
        value={v}
        min={0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full bg-transparent text-display text-5xl outline-none"
      />
    </div>
  );
}

function Chips({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (o: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              on ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
