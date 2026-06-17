import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { HealthGauge } from "@/components/finexa/HealthGauge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, Loader2, CreditCard, Sparkles } from "lucide-react";
import { useState } from "react";
import { TransactionsAPI } from "@/lib/api/transactions";
import { HealthAPI } from "@/lib/api/health";
import { apiFetch } from "@/lib/api/client";

export const Route = createFileRoute("/app/emergency")({
  component: Emergency,
});

function Emergency() {
  const queryClient = useQueryClient();
  const [creditForm, setCreditForm] = useState({ monthly_income: "", monthly_debt: "", credit_utilization: "" });
  const [creditResult, setCreditResult] = useState<any>(null);
  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ["tx-summary"],
    queryFn: () => TransactionsAPI.summary(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["health-score"],
    queryFn: () => HealthAPI.getScore(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: breakdown } = useQuery({
    queryKey: ["health-breakdown"],
    queryFn: () => HealthAPI.getBreakdown(),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const { data: recommendations } = useQuery({
    queryKey: ["health-recs"],
    queryFn: () => HealthAPI.getRecommendations(),
    staleTime: 15 * 60 * 1000,
    retry: false,
  });

  const recalculateMutation = useMutation({
    mutationFn: () => HealthAPI.recalculate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-score"] });
      queryClient.invalidateQueries({ queryKey: ["health-breakdown"] });
      queryClient.invalidateQueries({ queryKey: ["health-recs"] });
    },
  });

  const creditMutation = useMutation({
    mutationFn: (data: any) => apiFetch<any>("/api/ai/credit-analysis/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: (data) => setCreditResult(data),
  });

  const monthlyExpense = summary?.total_expense ?? 0;
  const allTimeSavings = summary?.all_time_savings ?? 0;
  const monthlyIncome = summary?.total_income ?? 0;
  const monthsCovered = monthlyExpense > 0 ? +(allTimeSavings / monthlyExpense).toFixed(1) : 0;
  const readiness = Math.min(100, Math.round((monthsCovered / 6) * 100));
  const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0;
  const healthScore = breakdown?.overall_score ?? health?.score ?? 0;

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  const recs = recommendations?.recommendations?.slice(0, 4) ?? [];

  return (
    <>
      <PageHeader
        title="Emergency Fund"
        subtitle="The cash that buys you calm."
        action={
          <button
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-50"
          >
            {recalculateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Recalculate Score
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Coverage gauge */}
        <Card className="lg:col-span-2">
          {sumLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-brand-light" />
                <div className="text-display text-lg">Emergency Coverage</div>
              </div>
              <div className="text-display text-6xl">
                {monthsCovered}
                <span className="text-3xl text-muted-foreground"> mo</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {fmt(allTimeSavings)} covers ~{Math.round(monthsCovered * 30)} days at current spend.
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Readiness</span>
                  <span>{readiness}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full bg-gradient-to-r from-warning via-brand-light to-success transition-all"
                    style={{ width: `${readiness}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>1 mo</span><span>3 mo</span><span>6 mo</span><span>12 mo</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 text-center">
                {[
                  { label: "Savings", value: fmt(allTimeSavings), color: "text-brand-light" },
                  { label: "Monthly spend", value: fmt(monthlyExpense), color: "text-foreground" },
                  { label: "Monthly income", value: fmt(monthlyIncome), color: "text-success" },
                  { label: "Savings rate", value: `${savingsRate}%`, color: savingsRate >= 20 ? "text-success" : savingsRate >= 10 ? "text-warning" : "text-error" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-surface/60 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                    <div className={`text-base font-bold mt-1 ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Health Score */}
        <Card>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Financial Health Score</div>
          {healthLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <HealthGauge score={healthScore} />
              {breakdown?.factors && (
                <div className="mt-4 space-y-2">
                  {breakdown.factors.map((f: any) => {
                    const pct = f.max_score > 0 ? (f.score / f.max_score) * 100 : 0;
                    return (
                      <div key={f.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{f.display_name || f.name}</span>
                          <span>{f.score}/{f.max_score}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 70 ? "oklch(0.72 0.18 150)" : pct >= 40 ? "oklch(0.78 0.16 75)" : "oklch(0.63 0.22 25)"
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="mt-4">
        <div className="text-display text-lg mb-3">What you can improve</div>
        {recs.length > 0 ? (
          <ol className="grid md:grid-cols-2 gap-3">
            {recs.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3 text-sm">
                <div className="h-6 w-6 shrink-0 rounded-full bg-surface grid place-items-center text-xs">{i + 1}</div>
                <span className="text-muted-foreground">{r}</span>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="grid md:grid-cols-2 gap-3">
            {[
              { icon: AlertTriangle, text: "Boost monthly savings to reach 3-month safety buffer.", color: "text-warning" },
              { icon: CheckCircle2, text: "Stable monthly expenses — good consistency.", color: "text-success" },
              { icon: CheckCircle2, text: "Low debt-to-income ratio is a strong foundation.", color: "text-success" },
              { icon: AlertTriangle, text: "Target 6+ months emergency coverage for full protection.", color: "text-warning" },
            ].map(({ icon: Ic, text, color }, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3 text-sm">
                <Ic className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                <span>{text}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* Credit Analysis */}
      <Card className="mt-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-brand-light" />
          <div className="text-display text-lg">Credit Analysis</div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Get AI-powered insights on your credit health and debt management.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Monthly Income (₹)</label>
            <input
              type="number"
              value={creditForm.monthly_income}
              onChange={(e) => setCreditForm({ ...creditForm, monthly_income: e.target.value })}
              placeholder={String(monthlyIncome || 50000)}
              className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Monthly Debt/EMI (₹)</label>
            <input
              type="number"
              value={creditForm.monthly_debt}
              onChange={(e) => setCreditForm({ ...creditForm, monthly_debt: e.target.value })}
              placeholder="0"
              className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Credit Utilization (%)</label>
            <input
              type="number"
              value={creditForm.credit_utilization}
              onChange={(e) => setCreditForm({ ...creditForm, credit_utilization: e.target.value })}
              placeholder="30"
              min={0}
              max={100}
              className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => creditMutation.mutate({
            monthly_income: Number(creditForm.monthly_income) || monthlyIncome || 50000,
            monthly_debt: Number(creditForm.monthly_debt) || 0,
            credit_utilization: Number(creditForm.credit_utilization) || 30,
          })}
          disabled={creditMutation.isPending}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cta px-4 py-2 text-sm font-medium text-cta-foreground disabled:opacity-50"
        >
          {creditMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Analyze Credit</>
          )}
        </button>

        {creditResult && (
          <div className="mt-4 rounded-xl border border-border bg-surface/40 p-4">
            {creditResult.analysis ? (
              <div className="space-y-3">
                {creditResult.analysis.score !== undefined && (
                  <div className="flex items-center gap-3">
                    <div className="text-display text-3xl">{creditResult.analysis.score}</div>
                    <div className="text-sm text-muted-foreground">{creditResult.analysis.category || "Credit Score Estimate"}</div>
                  </div>
                )}
                {creditResult.analysis.recommendations && (
                  <ul className="space-y-2">
                    {creditResult.analysis.recommendations.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-brand-light shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {typeof creditResult === "string" ? creditResult : creditResult.message || JSON.stringify(creditResult, null, 2)}
              </p>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
