import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { TransactionsAPI } from "@/lib/api/transactions";
import { AIAPI } from "@/lib/api/ai";

export const Route = createFileRoute("/app/budget")({
  component: Budget,
});

function Budget() {
  const [simCategory, setSimCategory] = useState("");
  const [reduceAmt, setReduceAmt] = useState(500);
  const [aiTips, setAiTips] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["tx-summary"],
    queryFn: () => TransactionsAPI.summary(),
    staleTime: 5 * 60 * 1000,
  });

  const income = summary?.total_income ?? 0;
  const totalExpense = summary?.total_expense ?? 0;
  const savings = income - totalExpense;
  const cats = summary?.categories ?? [];

  // 50/30/20 calc
  const NEEDS_CATS = new Set(["Food", "Food & Dining", "Groceries", "Rent", "Housing", "Utilities", "Bills", "Transportation", "Transport", "Health", "Household", "Gas", "Insurance", "Education"]);
  const needsTotal = cats.filter((c: any) => NEEDS_CATS.has(c.name)).reduce((s: number, c: any) => s + c.amount, 0);
  const wantsTotal = cats.filter((c: any) => !NEEDS_CATS.has(c.name)).reduce((s: number, c: any) => s + c.amount, 0);

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  const selectedCat = cats.find((c: any) => c.name === simCategory);
  const sliderMax = Math.min(Math.max((selectedCat?.amount ?? 2000), 500), 10000);

  async function loadAiTips() {
    setAiLoading(true);
    try {
      const data = await AIAPI.getBudgetAdvice();
      if (data?.tips) setAiTips(data.tips);
    } catch { /* silent */ }
    finally { setAiLoading(false); }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Budget Optimizer" subtitle="AI-tuned allocation." />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Budget Optimizer" subtitle="AI-tuned allocation that bends with your life." />

      {/* Income overview */}
      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Card>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Monthly income</div>
          <div className="mt-2 text-display text-4xl">{fmt(income)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Spent {fmt(totalExpense)} · Saved {fmt(Math.max(0, savings))}
          </div>
        </Card>

        {/* 50/30/20 */}
        <Card className="lg:col-span-2">
          <div className="text-display text-lg mb-3">50 / 30 / 20 analysis</div>
          {income === 0 ? (
            <p className="text-sm text-muted-foreground">Add income transactions to see your 50/30/20 breakdown.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <Slice label="Needs" actual={needsTotal} target={income * 0.5} />
              <Slice label="Wants" actual={wantsTotal} target={income * 0.3} />
              <Slice label="Savings" actual={Math.max(0, savings)} target={income * 0.2} />
            </div>
          )}
        </Card>
      </div>

      {/* What-if simulator */}
      {cats.length > 0 && (
        <Card className="mb-4">
          <div className="text-display text-lg mb-3">What-if simulator</div>
          <p className="text-sm text-muted-foreground mb-4">Pick a category, reduce spending, see what you'd save.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-muted-foreground mb-2">Choose category:</div>
              <div className="flex flex-wrap gap-2">
                {cats.map((c: any) => (
                  <button
                    key={c.name}
                    onClick={() => { setSimCategory(c.name); setReduceAmt(Math.min(reduceAmt, Math.round(c.amount))); }}
                    className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                      simCategory === c.name
                        ? "bg-foreground text-background"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              {simCategory && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Reduce by: <strong className="text-foreground">{fmt(reduceAmt)}/mo</strong></span>
                    <span>Current: {fmt(selectedCat?.amount ?? 0)}</span>
                  </div>
                  <input
                    type="range" min={100} max={sliderMax} step={100}
                    value={Math.min(reduceAmt, sliderMax)}
                    onChange={(e) => setReduceAmt(+e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </div>
            {simCategory && (
              <div className="space-y-3">
                <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
                  <div className="text-display text-3xl text-success">{fmt(reduceAmt)}</div>
                  <div className="text-xs text-muted-foreground mt-1">saved per month</div>
                  <div className="text-xs text-success mt-0.5">= {fmt(reduceAmt * 12)}/year</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-surface/60 p-3 text-center">
                    <div className="text-xs text-muted-foreground">Current savings</div>
                    <div className="text-brand-light font-semibold mt-0.5">{fmt(Math.max(0, savings))}</div>
                  </div>
                  <div className="rounded-lg bg-surface/60 p-3 text-center">
                    <div className="text-xs text-muted-foreground">New savings</div>
                    <div className="text-success font-semibold mt-0.5">{fmt(Math.max(0, savings) + reduceAmt)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Category bars */}
      {cats.length > 0 && (
        <Card className="mb-4">
          <div className="text-display text-lg mb-3">Spending by category</div>
          <div className="space-y-3">
            {cats.map((c: any) => {
              const pct = income > 0 ? Math.min(100, Math.round((c.amount / income) * 100)) : 0;
              return (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span>{c.name}</span>
                    <span className="tabular-nums text-muted-foreground">{fmt(c.amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* AI Tips */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-light" />
            <div className="text-display text-lg">AI recommendations</div>
          </div>
          {aiTips.length === 0 && (
            <button
              onClick={loadAiTips}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-foreground/5 disabled:opacity-50"
            >
              {aiLoading ? <><Loader2 className="h-3 w-3 animate-spin" /> Analysing…</> : "Get AI advice"}
            </button>
          )}
        </div>
        {aiTips.length > 0 ? (
          <ul className="space-y-3">
            {aiTips.map((tip: any, i: number) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3 text-sm">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 text-brand-light shrink-0" />
                <div>
                  <div>{tip.tip}</div>
                  {tip.save_per_month > 0 && (
                    <div className="text-xs text-success mt-0.5">
                      Saves ₹{tip.save_per_month.toLocaleString("en-IN")}/mo
                    </div>
                  )}
                </div>
              </li>
            ))}
            <button
              onClick={loadAiTips}
              disabled={aiLoading}
              className="w-full rounded-lg border border-border py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {aiLoading ? "Refreshing…" : "🔄 Refresh"}
            </button>
          </ul>
        ) : !aiLoading ? (
          <p className="text-sm text-muted-foreground">
            Click "Get AI advice" to unlock personalised budget tips based on your actual spending.
          </p>
        ) : null}
      </Card>
    </>
  );
}

function Slice({ label, actual, target }: { label: string; actual: number; target: number }) {
  const pct = target > 0 ? Math.round((actual / target) * 100) : 0;
  const over = actual > target;
  const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-display text-2xl">{fmt(Math.round(actual))}</div>
      <div className={`text-xs mt-0.5 ${over ? "text-error" : "text-success"}`}>
        {pct}% of {fmt(Math.round(target))} target
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full ${over ? "bg-error" : "bg-gradient-to-r from-brand to-brand-light"}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
