import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Sparkles, AlertCircle, Loader2, Landmark } from "lucide-react";
import { useState } from "react";
import { AuthAPI } from "@/lib/api/auth";
import { AIAPI } from "@/lib/api/ai";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/billing")({
  component: Billing,
});

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    credits: 50000,
    features: ["50,000 AI credits", "Financial Health Score", "Budget tracking", "3 savings goals", "Basic AI coach"],
    unavailable: ["Document upload & AI analysis", "Advanced simulations", "Unlimited goals"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹599",
    sub: "/mo",
    credits: 1000000,
    popular: true,
    features: ["1,000,000 AI credits/month", "Everything in Starter", "Document upload & AI analysis", "Unlimited goals", "Advanced simulations", "AI coach with file chat"],
    unavailable: ["Dedicated account manager"],
  },
  {
    id: "elite",
    name: "Elite",
    price: "₹1,299",
    sub: "/mo",
    credits: 5000000,
    features: ["5,000,000 AI credits/month", "Everything in Pro", "Priority support", "Dedicated manager", "Advanced analytics"],
    unavailable: [],
  },
];

const CREDIT_USAGE = [
  { action: "Document upload & AI extraction", cost: 5 },
  { action: "AI chat message (RAG)", cost: 0 },
  { action: "Financial health score", cost: 0 },
  { action: "Budget advice", cost: 0 },
  { action: "Goal plan AI analysis (refresh)", cost: 15 },
  { action: "Income simulation (AI)", cost: 10 },
];

function Billing() {
  const { user, addCredits } = useAuth();
  const qc = useQueryClient();
  const [buying, setBuying] = useState<string | null>(null);

  const { data: hunterData, isLoading: hunterLoading } = useQuery({
    queryKey: ["subscription-hunter"],
    queryFn: () => AIAPI.getSubscriptionHunter(),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  const { data: loansData } = useQuery({
    queryKey: ["loans"],
    queryFn: () => apiFetch<any>("/api/ai/loans/"),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const purchaseMutation = useMutation({
    mutationFn: (planId: string) => AuthAPI.purchaseCredits(planId),
    onSuccess: (data) => {
      addCredits(data.credits_added);
      qc.invalidateQueries({ queryKey: ["profile-full"] });
      setBuying(null);
    },
    onError: () => setBuying(null),
  });

  function handlePurchase(planId: string) {
    if (planId === "starter") return;
    setBuying(planId);
    purchaseMutation.mutate(planId);
  }

  const aiCredits = user?.ai_credits ?? 0;
  const creditPct = Math.min(100, (aiCredits / 100000) * 100);

  return (
    <>
      <PageHeader title="Subscription & Billing" subtitle="Plan, credits, history — all in one place." />

      {/* Subscription Hunter */}
      {!hunterLoading && hunterData?.data?.subscriptions?.length > 0 && (
        <Card className="mb-6 border-brand-light/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-brand-light" />
            <div className="text-display text-lg">AI Subscription Hunter</div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{hunterData.insight}</p>
          <div className="space-y-3">
            {hunterData.data.subscriptions.slice(0, 5).map((sub: any, i: number) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl border p-4 ${sub.cancel_recommended ? "border-error/30 bg-error/5" : "border-border bg-surface/40"}`}
              >
                <div>
                  <div className="font-medium text-sm">{sub.brand}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {sub.occurrences} payments detected
                  </div>
                  {sub.cancel_recommended && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-error">
                      <AlertCircle className="h-3 w-3" /> {sub.recommendation}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold">₹{sub.estimated_monthly_cost?.toFixed(0)}/mo</div>
                  <span className={`text-[10px] rounded-full px-2 py-0.5 ${sub.status === "inactive" ? "bg-error/15 text-error" : "bg-success/15 text-success"}`}>
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Loans */}
      <LoansSection loans={loansData} />

      {/* Credits status */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-brand/15 grid place-items-center">
            <Sparkles className="h-6 w-6 text-brand-light" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <div className="font-medium">AI Credits Remaining</div>
              <div className="text-display text-2xl text-brand-light">
                {aiCredits >= 1000 ? `${(aiCredits / 1000).toFixed(0)}k` : aiCredits}
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full bg-gradient-to-r from-brand to-brand-light transition-all"
                style={{ width: `${creditPct}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {aiCredits.toLocaleString()} credits · resets on plan renewal
            </div>
          </div>
        </div>
      </Card>

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={plan.popular ? "border-brand-light" : ""}>
            {plan.popular && (
              <div className="mb-3">
                <span className="rounded-full bg-brand-light/15 text-brand-light px-2 py-0.5 text-[10px] font-bold">
                  MOST POPULAR
                </span>
              </div>
            )}
            <div className="text-display text-2xl">{plan.name}</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-display text-4xl">{plan.price}</span>
              {plan.sub && <span className="text-sm text-muted-foreground">{plan.sub}</span>}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {(plan.credits / 1000).toFixed(0)}k AI credits
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" /> {f}
                </li>
              ))}
              {plan.unavailable.map((f) => (
                <li key={f} className="flex items-start gap-2 opacity-35">
                  <div className="w-4 h-0.5 mt-2 bg-muted-foreground rounded shrink-0" />
                  <span className="line-through">{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePurchase(plan.id)}
              disabled={plan.id === "starter" || buying === plan.id || purchaseMutation.isPending}
              className={`mt-6 w-full rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
                plan.popular
                  ? "bg-cta text-cta-foreground"
                  : plan.id === "starter"
                  ? "border border-border text-muted-foreground cursor-default"
                  : "bg-foreground text-background"
              }`}
            >
              {buying === plan.id ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
              ) : plan.id === "starter" ? (
                "Current plan"
              ) : (
                `Get ${plan.name}`
              )}
            </button>
          </Card>
        ))}
      </div>

      {/* Credit usage guide */}
      <Card>
        <div className="text-display text-lg mb-4">AI Credit Cost Guide</div>
        <div className="divide-y divide-border">
          {CREDIT_USAGE.map((u) => (
            <div key={u.action} className="flex items-center justify-between py-3 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-brand-light" />
                <span className="text-muted-foreground">{u.action}</span>
              </div>
              <span className="font-mono font-medium text-brand-light">
                {u.cost === 0 ? "Free" : `${u.cost} credits`}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Credits are deducted per API call. Unused credits do not roll over.
        </p>
      </Card>
    </>
  );
}

/* ─── Loans Section ─────────────────────────────────────────────────────── */
function LoansSection({ loans }: { loans: any }) {
  const loanList = Array.isArray(loans) ? loans : loans?.results ?? [];
  
  if (loanList.length === 0) return null;

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  return (
    <Card className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Landmark className="h-5 w-5 text-brand-light" />
        <div className="text-display text-lg">Active Loans</div>
      </div>
      <div className="space-y-3">
        {loanList.map((loan: any, i: number) => {
          const pct = loan.amount_paid && loan.total_amount
            ? Math.round((loan.amount_paid / loan.total_amount) * 100)
            : 0;
          return (
            <div key={loan.id || i} className="rounded-xl border border-border bg-surface/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{loan.title || loan.loan_type || "Loan"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {loan.lender || ""} {loan.interest_rate ? `· ${loan.interest_rate}% APR` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{fmt(loan.emi || loan.monthly_payment || 0)}/mo</div>
                  <div className="text-xs text-muted-foreground">
                    {fmt(loan.remaining_amount || loan.total_amount || 0)} remaining
                  </div>
                </div>
              </div>
              {pct > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{pct}% paid off</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
