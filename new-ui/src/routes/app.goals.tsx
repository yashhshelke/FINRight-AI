import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Sparkles, TrendingUp, Loader2, X, Target, Activity, BarChart3 } from "lucide-react";
import { useState } from "react";
import { GoalsAPI, type Goal } from "@/lib/api/goals";

export const Route = createFileRoute("/app/goals")({
  component: Goals,
});

const ICONS = ["🎯", "✈️", "🏠", "💻", "🛡️", "🎓", "💍", "🚗", "💰", "📈"];
const PRIORITIES = ["high", "medium", "low"] as const;

function Goals() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"goals" | "simulate" | "invest">("goals");
  const [form, setForm] = useState({
    title: "", target_amount: "", current_amount: "0",
    monthly_contribution: "", deadline: "", priority: "medium", icon: "🎯",
  });
  const [addSavingsId, setAddSavingsId] = useState<number | null>(null);
  const [addAmt, setAddAmt] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => GoalsAPI.list(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: aiPlan, isLoading: aiLoading } = useQuery({
    queryKey: ["goal-ai-plan"],
    queryFn: () => GoalsAPI.getAIPlan(false),
    staleTime: 15 * 60 * 1000,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (d: Parameters<typeof GoalsAPI.create>[0]) => GoalsAPI.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); setShowModal(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => GoalsAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Goal> }) => GoalsAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); setAddSavingsId(null); setAddAmt(""); },
  });

  function resetForm() {
    setForm({ title: "", target_amount: "", current_amount: "0", monthly_contribution: "", deadline: "", priority: "medium", icon: "🎯" });
  }

  function handleCreate() {
    if (!form.title || !form.target_amount || !form.deadline) return;
    createMutation.mutate({
      title: form.title,
      target_amount: +form.target_amount,
      current_amount: +form.current_amount,
      deadline: form.deadline,
      priority: form.priority,
      monthly_contribution: +form.monthly_contribution || 0,
      icon: form.icon,
    });
  }

  function handleAddSavings(goal: Goal) {
    const amt = parseFloat(addAmt);
    if (!amt || amt <= 0) return;
    updateMutation.mutate({ id: goal.id, data: { current_amount: goal.current_amount + amt } });
  }

  const goals: Goal[] = data?.results ?? [];
  const aiGoals: any[] = aiPlan?.goals_analysis ?? [];
  const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  const TABS = [
    { id: "goals" as const, label: "My Goals", icon: Target },
    { id: "simulate" as const, label: "Income Simulation", icon: Activity },
    { id: "invest" as const, label: "Investment Plan", icon: BarChart3 },
  ];

  return (
    <>
      <PageHeader
        title="Goals"
        subtitle="Turn intentions into outcomes."
        action={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-sm font-medium text-cta-foreground"
          >
            <Plus className="h-4 w-4" /> New goal
          </button>
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-surface/60 p-1 border border-border w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
              tab === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "goals" && (
        <GoalsTab
          goals={goals}
          isLoading={isLoading}
          aiGoals={aiGoals}
          aiPlan={aiPlan}
          aiLoading={aiLoading}
          fmt={fmt}
          addSavingsId={addSavingsId}
          addAmt={addAmt}
          setAddSavingsId={setAddSavingsId}
          setAddAmt={setAddAmt}
          handleAddSavings={handleAddSavings}
          deleteMutation={deleteMutation}
          updateMutation={updateMutation}
          setShowModal={setShowModal}
        />
      )}

      {tab === "simulate" && <IncomeSimulationTab goals={goals} fmt={fmt} />}
      {tab === "invest" && <InvestmentPlanTab goals={goals} fmt={fmt} />}

      {/* Create Goal Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl md:rounded-2xl border border-border bg-card p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-display text-xl">New Goal</h3>
              <button onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setForm({ ...form, icon: ic })}
                  className={`text-xl p-2 rounded-lg transition-colors ${form.icon === ic ? "bg-brand/20 ring-1 ring-brand-light" : "bg-surface/60"}`}
                >
                  {ic}
                </button>
              ))}
            </div>

            <div className="space-y-3 mb-5">
              {[
                { label: "Goal title *", key: "title", type: "text", placeholder: "e.g. Tokyo Trip" },
                { label: "Target amount (₹) *", key: "target_amount", type: "number", placeholder: "100000" },
                { label: "Already saved (₹)", key: "current_amount", type: "number", placeholder: "0" },
                { label: "Monthly contribution (₹)", key: "monthly_contribution", type: "number", placeholder: "5000" },
                { label: "Deadline *", key: "deadline", type: "date", placeholder: "" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    min={type === "number" ? 0 : undefined}
                    placeholder={placeholder}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setForm({ ...form, priority: p })}
                      className={`flex-1 rounded-lg py-2 text-xs capitalize transition-colors ${
                        form.priority === p ? "bg-foreground text-background" : "border border-border text-muted-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !form.title || !form.target_amount || !form.deadline}
              className="w-full rounded-lg bg-cta py-2.5 text-sm font-medium text-cta-foreground disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create Goal"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Goals Tab ─────────────────────────────────────────────────────────── */
function GoalsTab({ goals, isLoading, aiGoals, aiPlan, aiLoading, fmt, addSavingsId, addAmt, setAddSavingsId, setAddAmt, handleAddSavings, deleteMutation, updateMutation, setShowModal }: any) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><Skeleton className="h-48 w-full" /></Card>
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <Card className="py-16 text-center">
        <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">No goals yet.</p>
        <button
          onClick={() => setShowModal(true)}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-sm font-medium text-cta-foreground"
        >
          <Plus className="h-4 w-4" /> Create your first goal
        </button>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g: Goal) => {
          const pct = g.progress_percentage ?? Math.min(100, Math.round((g.current_amount / Math.max(g.target_amount, 1)) * 100));
          const aiData = aiGoals.find((a: any) => a.goal_id === g.id);
          return (
            <Card key={g.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand to-brand-light grid place-items-center text-xl">
                    {g.icon || "🎯"}
                  </div>
                  <div>
                    <div className="text-display text-xl">{g.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.deadline ? `Target: ${g.deadline}` : "No deadline set"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {aiData && (
                    <span className="text-xs rounded-full border border-border px-2 py-1 text-muted-foreground">
                      {aiData.feasibility_pct ?? 0}% feasible
                    </span>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(g.id)}
                    className="p-1.5 text-muted-foreground hover:text-error rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-5 flex items-baseline justify-between">
                <div className="text-display text-3xl tabular-nums">{fmt(g.current_amount)}</div>
                <div className="text-sm text-muted-foreground">of {fmt(g.target_amount)}</div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-surface/60 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Monthly</div>
                  <div className="text-sm">{fmt(g.monthly_contribution || 0)}</div>
                </div>
                <div className="rounded-lg bg-surface/60 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Required</div>
                  <div className="text-sm">{fmt(g.required_monthly || 0)}</div>
                </div>
                <div className="rounded-lg bg-surface/60 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Progress</div>
                  <div className="text-sm">{pct}%</div>
                </div>
              </div>

              {addSavingsId === g.id ? (
                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    value={addAmt}
                    min={0}
                    onChange={(e: any) => setAddAmt(e.target.value)}
                    placeholder="Amount ₹"
                    className="flex-1 rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
                  />
                  <button
                    onClick={() => handleAddSavings(g)}
                    disabled={updateMutation.isPending}
                    className="rounded-lg bg-success px-3 py-2 text-sm text-background font-medium disabled:opacity-60"
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </button>
                  <button onClick={() => { setAddSavingsId(null); setAddAmt(""); }} className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddSavingsId(g.id)}
                  className="mt-3 w-full rounded-lg border border-success/30 bg-success/10 py-2 text-sm text-success hover:bg-success/20 transition-colors"
                >
                  + Add savings
                </button>
              )}

              {aiData && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-surface/40 p-3 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-brand-light mt-0.5 shrink-0" />
                  <div>
                    <span className="text-foreground">AI: </span>
                    <span className="text-muted-foreground">
                      {aiData.probability_explanation || `${aiData.feasibility_status || "Analysing"} — ${fmt(aiData.savings_gap || 0)} gap/mo.`}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {aiPlan?.prioritization && (
        <Card className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-brand-light" />
            <div className="text-display text-lg">AI Goal Strategy</div>
            {aiLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground">{aiPlan.prioritization.strategy_summary}</p>
        </Card>
      )}
    </>
  );
}

/* ─── Income Simulation Tab ─────────────────────────────────────────────── */
function IncomeSimulationTab({ goals, fmt }: { goals: Goal[]; fmt: (n: number) => string }) {
  const [changePct, setChangePct] = useState(0);
  const [simResult, setSimResult] = useState<any>(null);

  const simulateMutation = useMutation({
    mutationFn: (pct: number) => GoalsAPI.simulateIncome(pct),
    onSuccess: (data) => setSimResult(data),
  });

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-brand-light" />
          <div className="text-display text-lg">Income Change Simulation</div>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          See how a change in your income would impact your goal timelines and feasibility.
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Income change</span>
              <span className={changePct >= 0 ? "text-success" : "text-error"}>
                {changePct >= 0 ? "+" : ""}{changePct}%
              </span>
            </div>
            <input
              type="range"
              min={-50}
              max={100}
              step={5}
              value={changePct}
              onChange={(e) => setChangePct(Number(e.target.value))}
              className="w-full accent-brand-light"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>-50%</span>
              <span>0%</span>
              <span>+100%</span>
            </div>
          </div>

          <button
            onClick={() => simulateMutation.mutate(changePct)}
            disabled={simulateMutation.isPending}
            className="w-full rounded-lg bg-cta py-2.5 text-sm font-medium text-cta-foreground disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {simulateMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Simulating...</>
            ) : (
              <><Activity className="h-4 w-4" /> Simulate Impact</>
            )}
          </button>
        </div>
      </Card>

      {simResult && (
        <Card>
          <div className="text-display text-lg mb-4">Simulation Results</div>
          {simResult.goals_impact ? (
            <div className="space-y-3">
              {simResult.goals_impact.map((g: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface/40 p-3">
                  <div>
                    <div className="text-sm font-medium">{g.title || g.goal_title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {g.new_timeline || g.message || "Timeline adjusted"}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    g.feasible ? "bg-success/20 text-success" : "bg-error/20 text-error"
                  }`}>
                    {g.feasible ? "Feasible" : "At risk"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {simResult.summary || simResult.message || JSON.stringify(simResult)}
            </p>
          )}
        </Card>
      )}

      {goals.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-sm text-muted-foreground">Create goals first to simulate income changes.</p>
        </Card>
      )}
    </div>
  );
}

/* ─── Investment Plan Tab ───────────────────────────────────────────────── */
function InvestmentPlanTab({ goals, fmt }: { goals: Goal[]; fmt: (n: number) => string }) {
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(goals[0]?.id ?? null);
  const [riskProfile, setRiskProfile] = useState("Moderate");
  const [monthlyAmt, setMonthlyAmt] = useState("");
  const [investResult, setInvestResult] = useState<any>(null);

  const investMutation = useMutation({
    mutationFn: () => GoalsAPI.getInvestment(selectedGoalId!, riskProfile, Number(monthlyAmt) || 5000),
    onSuccess: (data) => setInvestResult(data),
  });

  const RISK_PROFILES = ["Conservative", "Moderate", "Aggressive"];

  if (goals.length === 0) {
    return (
      <Card className="text-center py-8">
        <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Create goals first to get personalized investment plans.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-brand-light" />
          <div className="text-display text-lg">AI Investment Strategy</div>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Get a personalized investment plan to reach your goal faster.
        </p>

        <div className="space-y-4">
          {/* Goal selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Select Goal</label>
            <select
              value={selectedGoalId ?? ""}
              onChange={(e) => setSelectedGoalId(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
            >
              {goals.map((g: Goal) => (
                <option key={g.id} value={g.id}>
                  {g.icon} {g.title} — {fmt(g.target_amount)}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Profile */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Risk Profile</label>
            <div className="flex gap-2">
              {RISK_PROFILES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskProfile(r)}
                  className={`flex-1 rounded-lg py-2 text-xs transition-colors ${
                    riskProfile === r ? "bg-foreground text-background" : "border border-border text-muted-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly contribution */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Monthly Contribution (₹)</label>
            <input
              type="number"
              value={monthlyAmt}
              onChange={(e) => setMonthlyAmt(e.target.value)}
              placeholder="5000"
              min={0}
              className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
            />
          </div>

          <button
            onClick={() => investMutation.mutate()}
            disabled={investMutation.isPending || !selectedGoalId}
            className="w-full rounded-lg bg-cta py-2.5 text-sm font-medium text-cta-foreground disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {investMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Get Investment Plan</>
            )}
          </button>
        </div>
      </Card>

      {investResult && (
        <Card>
          <div className="text-display text-lg mb-4">Investment Recommendation</div>
          {investResult.strategy ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{investResult.strategy.summary || investResult.strategy}</p>
              {investResult.allocations && Array.isArray(investResult.allocations) && (
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Suggested Allocation</div>
                  {investResult.allocations.map((a: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface/40 p-3">
                      <div>
                        <div className="text-sm font-medium">{a.asset_class || a.name}</div>
                        <div className="text-xs text-muted-foreground">{a.reason || a.description || ""}</div>
                      </div>
                      <span className="text-sm font-medium text-brand-light">{a.percentage || a.allocation}%</span>
                    </div>
                  ))}
                </div>
              )}
              {investResult.expected_return && (
                <div className="rounded-lg bg-success/10 border border-success/20 p-3">
                  <div className="text-xs text-muted-foreground">Expected Annual Return</div>
                  <div className="text-lg font-medium text-success">{investResult.expected_return}%</div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {typeof investResult === "string" ? investResult : JSON.stringify(investResult, null, 2)}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
