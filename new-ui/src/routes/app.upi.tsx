import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Upload, Smartphone, Loader2, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

export const Route = createFileRoute("/app/upi")({
  component: UPI,
});

const TABS = ["Overview", "Categories", "Merchants", "Subscriptions", "Savings tips"] as const;

// Client-side CSV parser for UPI statements
function parseCSVBasic(text: string): { date: string; description: string; debit: number; credit: number }[] {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return {
      date: cols[0]?.trim() || "",
      description: cols[1]?.trim() || "Unknown",
      debit: parseFloat(cols[2]?.replace(/[^\d.]/g, "") || "0") || 0,
      credit: parseFloat(cols[3]?.replace(/[^\d.]/g, "") || "0") || 0,
    };
  }).filter((r) => r.date);
}

function UPI() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setProcessing(true);
    setError("");
    try {
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const rows = parseCSVBasic(text);
        if (rows.length === 0) throw new Error("No transactions found in file.");
        const totalIncome = rows.reduce((s, r) => s + r.credit, 0);
        const totalExpense = rows.reduce((s, r) => s + r.debit, 0);
        const catMap: Record<string, number> = {};
        rows.filter((r) => r.debit > 0).forEach((r) => {
          const cat = categorise(r.description);
          catMap[cat] = (catMap[cat] || 0) + r.debit;
        });
        const categories = Object.entries(catMap)
          .sort(([, a], [, b]) => b - a)
          .map(([name, v]) => ({ name, v: Math.round(v) }));
        const merchantMap: Record<string, number> = {};
        rows.filter((r) => r.debit > 0).forEach((r) => {
          const m = r.description.split(" ")[0];
          merchantMap[m] = (merchantMap[m] || 0) + r.debit;
        });
        const merchants = Object.entries(merchantMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([name, v]) => ({ name, v: Math.round(v), c: 1 }));
        setResult({ totalIncome, totalExpense, totalTxns: rows.length, categories, merchants, fileName: file.name });
        setTab("Overview");
      } else {
        throw new Error("Please upload a CSV file. PDF parsing requires the backend processor.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  }

  const COLORS = ["oklch(0.58 0.13 165)", "oklch(0.72 0.18 50)", "oklch(0.78 0.16 75)", "oklch(0.6 0.12 220)", "oklch(0.7 0.15 320)", "oklch(0.5 0.05 250)"];
  const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
  const savingsRate = result && result.totalIncome > 0 ? Math.round(((result.totalIncome - result.totalExpense) / result.totalIncome) * 100) : 0;

  return (
    <>
      <PageHeader
        title="UPI Analyzer"
        subtitle="Drop a statement. Get a clear story of your money."
        action={
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-sm font-medium text-cta-foreground"
          >
            <Upload className="h-4 w-4" /> Upload CSV
          </button>
        }
      />

      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {!result && (
        <Card className="mb-6">
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface/40 p-12 text-center cursor-pointer"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            {processing ? (
              <>
                <Loader2 className="h-8 w-8 text-brand-light animate-spin" />
                <div className="mt-3 text-sm">Analysing in your browser…</div>
              </>
            ) : (
              <>
                <Smartphone className="h-8 w-8 text-brand-light" />
                <div className="mt-3 text-sm">Drop your UPI / bank statement CSV here</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-success">
                  <ShieldCheck className="h-3.5 w-3.5" /> Processed locally — data never leaves your browser
                </div>
              </>
            )}
          </div>
          {error && <div className="mt-2 text-sm text-error">{error}</div>}
        </Card>
      )}

      {result && (
        <>
          {/* KPIs */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-4">
            {[
              { l: "Total income", v: fmt(result.totalIncome), c: "text-success" },
              { l: "Total expenses", v: fmt(result.totalExpense), c: "text-error" },
              { l: "Net savings", v: fmt(result.totalIncome - result.totalExpense), c: "text-brand-light" },
              { l: "Savings rate", v: `${savingsRate}%`, c: savingsRate >= 20 ? "text-success" : "text-warning" },
            ].map(({ l, v, c }) => (
              <Card key={l} className="p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
                <div className={`mt-2 text-display text-2xl ${c}`}>{v}</div>
              </Card>
            ))}
          </div>

          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{result.fileName} · {result.totalTxns} transactions</div>
              <div className="flex items-center gap-1.5 text-xs text-success mt-0.5">
                <ShieldCheck className="h-3 w-3" /> Processed locally
              </div>
            </div>
            <button
              onClick={() => { setResult(null); setError(""); }}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              New upload
            </button>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="flex items-center border-b border-border px-2 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative whitespace-nowrap px-4 py-3 text-sm transition-colors ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t}
                  {tab === t && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-brand-light" />}
                </button>
              ))}
            </div>
            <div className="p-6 min-h-[240px]">
              {tab === "Overview" && result.categories.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-3">Spending by category</div>
                    <div className="h-48">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={result.categories} dataKey="v" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                            {result.categories.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "oklch(0.235 0.014 250)", border: "none", borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {result.categories.slice(0, 6).map((c: any, i: number) => (
                      <div key={c.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          {c.name}
                        </div>
                        <span className="tabular-nums text-muted-foreground">{fmt(c.v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "Categories" && (
                <ul className="space-y-2 text-sm">
                  {result.categories.map((c: any, i: number) => (
                    <li key={c.name}>
                      <div className="flex justify-between mb-1">
                        <span>{c.name}</span>
                        <span className="tabular-nums text-muted-foreground">{fmt(c.v)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (c.v / result.totalExpense) * 100)}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {tab === "Merchants" && (
                <ul className="space-y-2 text-sm">
                  {result.merchants.map((m: any, i: number) => (
                    <li key={m.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full bg-surface grid place-items-center text-xs">{i + 1}</div>
                        <span>{m.name}</span>
                      </div>
                      <span className="tabular-nums">{fmt(m.v)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {tab === "Subscriptions" && (
                <p className="text-sm text-muted-foreground">
                  Subscription detection requires multiple months of data. Upload statements from different months for better analysis.
                </p>
              )}

              {tab === "Savings tips" && (
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {result.categories.slice(0, 3).map((c: any) => (
                    <li key={c.name} className="flex items-start gap-2">
                      <span className="text-brand-light">•</span>
                      Reduce {c.name} by 20% → saves {fmt(Math.round(c.v * 0.2))} per month.
                    </li>
                  ))}
                  <li className="flex items-start gap-2">
                    <span className="text-brand-light">•</span>
                    Your savings rate is {savingsRate}%. Target 20%+ for long-term wealth building.
                  </li>
                </ul>
              )}
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function categorise(desc: string): string {
  const d = desc.toLowerCase();
  if (/swiggy|zomato|food|restaurant|cafe/.test(d)) return "Food & Dining";
  if (/amazon|flipkart|shopping|myntra/.test(d)) return "Shopping";
  if (/uber|ola|metro|bus|petrol/.test(d)) return "Transport";
  if (/netflix|spotify|youtube|prime/.test(d)) return "Subscriptions";
  if (/electricity|water|gas|bill/.test(d)) return "Bills";
  if (/rent|housing/.test(d)) return "Housing";
  if (/hospital|doctor|medicine|pharmacy/.test(d)) return "Health";
  return "Other";
}
