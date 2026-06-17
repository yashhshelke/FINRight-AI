import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHeader, Stat } from "@/components/finexa/AppShell";
import { HealthGauge } from "@/components/finexa/HealthGauge";
import { MoneyReplay } from "@/components/finexa/MoneyReplay";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from "recharts";
import { ArrowUpRight, Plus, Sparkles, TrendingUp, Wallet, Target as TargetIcon } from "lucide-react";
import { HealthAPI } from "@/lib/api/health";
import { TransactionsAPI } from "@/lib/api/transactions";
import { GoalsAPI } from "@/lib/api/goals";
import { AIAPI } from "@/lib/api/ai";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/")({
  component: Overview,
});

function fmt(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function Overview() {
  const { user } = useAuth();

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

  const { data: goalsData } = useQuery({
    queryKey: ["goals"],
    queryFn: () => GoalsAPI.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: txData } = useQuery({
    queryKey: ["transactions", 1],
    queryFn: () => TransactionsAPI.list(1),
    staleTime: 2 * 60 * 1000,
  });

  const { data: briefing } = useQuery({
    queryKey: ["daily-briefing"],
    queryFn: () => AIAPI.getDailyBriefing(),
    staleTime: 60 * 60 * 1000,
  });

  const { data: healthHistory } = useQuery({
    queryKey: ["health-history"],
    queryFn: () => HealthAPI.getHistory(6),
    staleTime: 10 * 60 * 1000,
  });

  const cashflow = (healthHistory?.history ?? []).map((h: any, i: number) => ({
    m: h.month ? String(h.month).slice(5, 7) : `M${i + 1}`,
    income: summary?.total_income || 0,
    expense: summary?.total_expense || 0,
  }));

  const balance = summary?.all_time_savings ?? 0;
  const income = summary?.total_income ?? 0;
  const expense = summary?.total_expense ?? 0;
  const savings = summary?.savings ?? 0;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  const healthScore = health?.score ?? 0;
  const recentTxns = (txData?.results ?? []).slice(0, 5);
  const goals = (goalsData?.results ?? []).slice(0, 3);

  const displayName = user?.first_name || user?.username || "there";

  return (
    <>
      <PageHeader
        title={`Good morning, ${displayName}.`}
        subtitle="Here's your money, in one calm view."
        action={
          <Link
            to="/app/transactions"
            className="inline-flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-sm font-medium text-cta-foreground"
          >
            <Plus className="h-4 w-4" /> Add transaction
          </Link>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {sumLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><Skeleton className="h-16 w-full" /></Card>
          ))
        ) : (
          <>
            <Stat label="All-time savings" value={fmt(balance)} accent="up" />
            <Stat label="Income (Mo.)" value={fmt(income)} accent="up" />
            <Stat label="Expenses (Mo.)" value={fmt(expense)} accent="neutral" />
            <Stat label="Net savings" value={fmt(Math.max(0, savings))} delta={`${savingsRate}% rate`} accent={savings >= 0 ? "up" : "down"} />
          </>
        )}
      </div>

      {/* Cashflow Chart + Health Score */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Cash flow</div>
              <div className="text-display text-xl">This period</div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-light" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cta" /> Expense
              </span>
            </div>
          </div>
          {sumLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={cashflow.length ? cashflow : [{ m: "Now", income, expense }]}>
                  <defs>
                    <linearGradient id="ai" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.58 0.13 165)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.58 0.13 165)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ae" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.18 50)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.72 0.18 50)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                  <XAxis dataKey="m" stroke="oklch(0.72 0.02 250)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.72 0.02 250)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.235 0.014 250)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="income" stroke="oklch(0.58 0.13 165)" fill="url(#ai)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="oklch(0.72 0.18 50)" fill="url(#ae)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <div className="text-sm text-muted-foreground">Health score</div>
          {healthLoading ? (
            <Skeleton className="h-40 w-full mt-2" />
          ) : (
            <>
              <HealthGauge score={healthScore} />
              <div className="mt-2 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Savings rate</span>
                  <span className={savingsRate >= 20 ? "text-success" : savingsRate >= 10 ? "text-warning" : "text-error"}>
                    {savingsRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly expenses</span>
                  <span>{fmt(expense)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grade</span>
                  <span className="text-brand-light">{health?.category ?? "—"}</span>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Money Replay */}
      <div className="mt-6">
        <MoneyReplay />
      </div>

      {/* Recent Transactions + Daily Briefing */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-display text-lg">Recent transactions</div>
            <Link
              to="/app/transactions"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recentTxns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No transactions yet.{" "}
              <Link to="/app/transactions" className="text-foreground hover:underline">
                Add one
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentTxns.map((t: any) => {
                const amt = parseFloat(t.amount);
                const isIncome = t.type === "income";
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <div className="h-9 w-9 rounded-full bg-surface grid place-items-center text-xs">
                      {(t.description || t.category || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{t.description || t.category}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.category} · {t.date}
                      </div>
                    </div>
                    <div className={`text-sm font-medium tabular-nums ${isIncome ? "text-success" : ""}`}>
                      {isIncome ? "+" : "-"}
                      {fmt(Math.abs(amt))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-light" />
            <div className="text-display text-lg">Daily briefing</div>
          </div>
          {briefing ? (
            <>
              <p className="text-sm text-muted-foreground">
                {briefing.insight || briefing.highlights || "Your financial picture looks clear today."}
              </p>
              {briefing.actions && (
                <div className="mt-4 space-y-2">
                  {briefing.actions.slice(0, 3).map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3">
                      <TrendingUp className="h-4 w-4 mt-0.5 text-brand-light" />
                      <div className="min-w-0">
                        <div className="text-sm">{a.title || a}</div>
                        {a.subtitle && <div className="text-xs text-muted-foreground">{a.subtitle}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add transactions to unlock your AI daily briefing.
            </p>
          )}
        </Card>
      </div>

      {/* Goals Preview */}
      {goals.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {goals.map((g: any) => {
            const pct = g.progress_percentage ?? Math.min(100, Math.round((g.current_amount / Math.max(g.target_amount, 1)) * 100));
            return (
              <Card key={g.id}>
                <div className="flex items-center justify-between">
                  <div className="text-sm">{g.icon || "🎯"} {g.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmt(g.current_amount)} / {fmt(g.target_amount)}
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{pct}% complete</div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
