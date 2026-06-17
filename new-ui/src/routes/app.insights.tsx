import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { TransactionsAPI } from "@/lib/api/transactions";
import { AIAPI } from "@/lib/api/ai";
import { detectSpendingPersonality } from "@/lib/calculations";
import { useState } from "react";

export const Route = createFileRoute("/app/insights")({
  component: Insights,
});

const COLORS = [
  "oklch(0.58 0.13 165)", "oklch(0.72 0.18 50)", "oklch(0.78 0.16 75)",
  "oklch(0.6 0.12 220)", "oklch(0.7 0.15 320)", "oklch(0.5 0.05 250)",
  "oklch(0.65 0.18 200)", "oklch(0.75 0.12 100)",
];

function Insights() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ["tx-summary"],
    queryFn: () => TransactionsAPI.summary(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: analysis, isLoading: aiLoading } = useQuery({
    queryKey: ["spending-analysis", refreshKey],
    queryFn: () => AIAPI.getSpendingAnalysis(refreshKey > 0),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const cats = (summary?.categories ?? []).map((c: any, i: number) => ({
    name: c.name,
    v: Math.round(c.amount),
    c: COLORS[i % COLORS.length],
  }));

  const totalSpent = cats.reduce((s: number, c: any) => s + c.v, 0);
  const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  return (
    <>
      <PageHeader
        title="Spending Insights"
        subtitle="See yourself — patterns, anomalies, personality."
        action={
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${aiLoading ? "animate-spin" : ""}`} />
            Refresh AI
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Spending personality */}
        <Card>
          <div className="text-display text-lg mb-2">Spending personality</div>
          {sumLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (() => {
            const expenseData = cats.map((c: any) => ({
              name: c.name,
              amount: c.v,
              budget: Math.round(c.v * 1.15), // estimate budget as 115% of actual
            }));
            const personality = detectSpendingPersonality(expenseData);
            return (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-2xl grid place-items-center text-2xl"
                    style={{ background: `${personality.color}20`, border: `1px solid ${personality.color}30` }}>
                    {personality.icon}
                  </div>
                  <div>
                    <div className="text-display text-xl" style={{ color: personality.color }}>
                      {personality.type}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{personality.description}</p>
                {analysis?.patterns?.[0] && (
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                    {analysis.patterns[0]}
                  </p>
                )}
              </>
            );
          })()}
        </Card>

        {/* Category pie */}
        <Card>
          <div className="text-display text-lg mb-2">Categories · This month</div>
          {sumLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : cats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No expense data yet.</p>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={cats} dataKey="v" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {cats.map((c: any, i: number) => <Cell key={i} fill={c.c} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "oklch(0.235 0.014 250)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: any) => fmt(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                {cats.slice(0, 6).map((c: any) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.c }} />
                      {c.name}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{fmt(c.v)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Bar chart */}
        <Card>
          <div className="text-display text-lg mb-2">Category breakdown</div>
          {sumLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : cats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No data to chart yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={cats} layout="vertical">
                  <CartesianGrid stroke="oklch(1 0 0 / 0.05)" horizontal={false} />
                  <XAxis type="number" stroke="oklch(0.72 0.02 250)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="oklch(0.72 0.02 250)" fontSize={10} width={80} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.235 0.014 250)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12, fontSize: 12 }} formatter={(v: any) => fmt(v)} />
                  <Bar dataKey="v" radius={[0, 4, 4, 0]}>
                    {cats.map((c: any, i: number) => <Cell key={i} fill={c.c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Summary stats */}
      {!sumLoading && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { label: "Total spent", value: fmt(totalSpent), color: "text-error" },
            { label: "Total income", value: fmt(summary?.total_income ?? 0), color: "text-success" },
            { label: "Net savings", value: fmt((summary?.total_income ?? 0) - totalSpent), color: "text-brand-light" },
          ].map((s) => (
            <Card key={s.label} className="p-3">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            </Card>
          ))}
        </div>
      )}

      {/* AI Analysis */}
      {analysis && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {analysis.anomalies && analysis.anomalies.length > 0 && (
            <Card>
              <div className="text-display text-lg mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" /> Anomalies
              </div>
              <div className="space-y-2">
                {analysis.anomalies.map((a: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
                    <span className="text-muted-foreground">{a}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <Card>
              <div className="text-display text-lg mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-light" /> AI Recommendations
              </div>
              <div className="space-y-2">
                {analysis.recommendations.slice(0, 4).map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3">
                    <Sparkles className="h-3.5 w-3.5 mt-0.5 text-brand-light shrink-0" />
                    <div>
                      <div className="text-sm">{r.title || r.description}</div>
                      {r.potential_savings && (
                        <div className="text-xs text-success mt-0.5">{r.potential_savings}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

