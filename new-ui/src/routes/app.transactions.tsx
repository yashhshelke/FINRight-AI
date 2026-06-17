import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Plus, Search, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { TransactionsAPI, type Transaction } from "@/lib/api/transactions";

export const Route = createFileRoute("/app/transactions")({
  component: Transactions,
});

const CATEGORIES = ["Food", "Housing", "Transport", "Shopping", "Utilities", "Health", "Entertainment", "Income", "Other"];

function Transactions() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<"income" | "expense">("expense");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState("Food");
  const [newAmt, setNewAmt] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page, cat === "All" ? undefined : cat],
    queryFn: () => TransactionsAPI.list(page, cat === "All" ? undefined : cat),
    staleTime: 60 * 1000,
  });

  const { data: summary } = useQuery({
    queryKey: ["tx-summary"],
    queryFn: () => TransactionsAPI.summary(),
    staleTime: 5 * 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: (payload: Parameters<typeof TransactionsAPI.create>[0]) =>
      TransactionsAPI.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["tx-summary"] });
      setShowAdd(false);
      setNewDesc(""); setNewAmt(""); setNewCat("Food"); setNewType("expense");
    },
  });

  const txns: Transaction[] = data?.results ?? [];
  const filtered = txns.filter((t) =>
    t.description.toLowerCase().includes(q.toLowerCase()) ||
    t.category.toLowerCase().includes(q.toLowerCase())
  );

  const allCats = ["All", ...CATEGORIES];

  function handleAdd() {
    if (!newDesc || !newAmt) return;
    addMutation.mutate({
      amount: parseFloat(newAmt),
      category: newCat,
      type: newType,
      description: newDesc,
      date: new Date().toISOString().split("T")[0],
    });
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Every rupee in, every rupee out."
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-sm font-medium text-cta-foreground"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        }
      />

      {/* Summary Pills */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {[
          { label: "Income", value: summary?.total_income, color: "text-success" },
          { label: "Expenses", value: summary?.total_expense, color: "text-error" },
          { label: "Savings", value: summary?.savings, color: "text-brand-light" },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
            <div className={`mt-1 text-xl font-bold tabular-nums ${s.color}`}>
              {s.value != null ? `₹${Math.round(s.value).toLocaleString("en-IN")}` : "—"}
            </div>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search description or category…"
              className="w-full rounded-lg border border-border bg-surface/60 py-2 pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allCats.map((c) => (
              <button
                key={c}
                onClick={() => { setCat(c); setPage(1); }}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  cat === c
                    ? "bg-foreground text-background"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No transactions found.{" "}
            <button onClick={() => setShowAdd(true)} className="text-foreground hover:underline">
              Add one
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left hidden md:table-cell">Category</th>
                <th className="p-3 text-left hidden md:table-cell">Source</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => {
                const amt = parseFloat(t.amount);
                const isIncome = t.type === "income";
                return (
                  <tr key={t.id} className="hover:bg-foreground/[0.02]">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-surface grid place-items-center text-xs">
                          {(t.description || t.category).charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{t.description || t.category}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{t.category}</td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t.source || "manual"}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{t.date}</td>
                    <td className={`p-3 text-right tabular-nums font-medium ${isIncome ? "text-success" : ""}`}>
                      {isIncome ? "+" : "-"}₹{Math.abs(amt).toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      {(data?.next || page > 1) && (
        <div className="mt-4 flex justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-30"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-muted-foreground">Page {page}</span>
          <button
            disabled={!data?.next}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl md:rounded-2xl border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-display text-xl">Add Transaction</h3>
              <button onClick={() => setShowAdd(false)}><X className="h-4 w-4" /></button>
            </div>

            <div className="flex gap-2 mb-4">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                    newType === t
                      ? t === "income" ? "bg-success text-background" : "bg-error text-background"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {t === "income" ? "+ Income" : "- Expense"}
                </button>
              ))}
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Swiggy order"
                  className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  value={newAmt}
                  min={0}
                  onChange={(e) => setNewAmt(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={addMutation.isPending || !newDesc || !newAmt}
              className="w-full rounded-lg bg-cta py-2.5 text-sm font-medium text-cta-foreground disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {addMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                "Add Transaction"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
