import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { TransactionsAPI } from "@/lib/api/transactions";

export const Route = createFileRoute("/app/simulator")({
  component: Simulator,
});

function Simulator() {
  const [delta, setDelta] = useState(0);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["tx-summary"],
    queryFn: () => TransactionsAPI.summary(),
    staleTime: 5 * 60 * 1000,
  });

  const baseIncome = summary?.total_income ?? 0;
  const baseExpense = summary?.total_expense ?? 0;
  const allTimeSavings = summary?.all_time_savings ?? 0;

  const newIncome = Math.round(baseIncome * (1 + delta / 100));
  const newSavings = newIncome - baseExpense;
  const newRate = newIncome > 0 ? Math.max(0, Math.round((newSavings / newIncome) * 100)) : 0;
  const runway = newSavings >= 0
    ? "∞"
    : allTimeSavings > 0
      ? `${Math.round(allTimeSavings / Math.abs(newSavings))} mo`
      : "0 mo";

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  const chartData = [
    { name: "Current income", value: baseIncome, color: "oklch(0.72 0.18 150)" },
    { name: delta < 0 ? `Income −${Math.abs(delta)}%` : `Income +${delta}%`, value: newIncome, color: delta < 0 ? "oklch(0.63 0.22 25)" : "oklch(0.58 0.13 165)" },
    { name: "Monthly expenses", value: baseExpense, color: "oklch(0.6 0.12 220)" },
    { name: "Monthly gap", value: Math.abs(newSavings), color: newSavings < 0 ? "oklch(0.78 0.16 75)" : "oklch(0.72 0.18 150)" },
  ];

  return (
    <>
      <PageHeader title="Income Simulator" subtitle="Pre-live the next 12 months — without the stress." />

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : baseIncome === 0 ? (
        <Card className="py-16 text-center">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">No income data yet. Add income transactions to use the simulator.</p>
        </Card>
      ) : (
        <>
          {/* Slider */}
          <Card className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Income change</span>
              <span className="text-display text-2xl tabular-nums">{delta > 0 ? "+" : ""}{delta}%</span>
            </div>
            <input
              type="range" min={-100} max={50} step={5} value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { l: "Job loss", v: -100 },
                { l: "−30%", v: -30 },
                { l: "−10%", v: -10 },
                { l: "No change", v: 0 },
                { l: "+15% raise", v: 15 },
                { l: "+30% promo", v: 30 },
              ].map((p) => (
                <button
                  key={p.l}
                  onClick={() => setDelta(p.v)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    delta === p.v
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.l}
                </button>
              ))}
            </div>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <Card className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">New income</div>
              <div className="mt-2 text-display text-2xl">{fmt(newIncome)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Net savings</div>
              <div className={`mt-2 text-display text-2xl ${newSavings < 0 ? "text-error" : "text-success"}`}>
                {fmt(newSavings)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Savings rate</div>
              <div className="mt-2 text-display text-2xl">{newRate}%</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Runway</div>
              <div className={`mt-2 text-display text-2xl ${runway !== "∞" ? "text-warning" : "text-success"}`}>
                {runway}
              </div>
            </Card>
          </div>

          {/* Alert */}
          {newSavings < 0 && allTimeSavings / Math.abs(newSavings) < 3 && (
            <Card className="mb-4 border-error/30 bg-error/5">
              <div className="flex items-center gap-3 text-sm text-error">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                🚨 Critical: Less than 3 months of runway. Build your emergency fund immediately.
              </div>
            </Card>
          )}

          {/* Chart */}
          <Card className="mb-4">
            <div className="text-display text-lg mb-4">Financial impact visualisation</div>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="oklch(0.72 0.02 250)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.72 0.02 250)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.235 0.014 250)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any) => fmt(v)}
                  />
                  <ReferenceLine y={0} stroke="oklch(0.72 0.02 250)" />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Goal impact */}
          <Card>
            <div className="text-display text-lg mb-3">Goal impact</div>
            {newSavings >= 0 ? (
              <p className="text-sm text-success">✅ Your income still covers all expenses. Goals remain on track.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {[
                  { cat: "Entertainment", cut: Math.round(Math.abs(newSavings) * 0.2), icon: "🎬" },
                  { cat: "Shopping", cut: Math.round(Math.abs(newSavings) * 0.3), icon: "🛍️" },
                  { cat: "Subscriptions", cut: Math.round(Math.abs(newSavings) * 0.15), icon: "📱" },
                  { cat: "Dining Out", cut: Math.round(Math.abs(newSavings) * 0.2), icon: "🍽️" },
                ].map((item) => (
                  <div key={item.cat} className="flex items-center justify-between rounded-lg border border-border bg-surface/40 p-3">
                    <div className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span>{item.cat}</span>
                    </div>
                    <span className="text-error">Reduce by {fmt(item.cut)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}
