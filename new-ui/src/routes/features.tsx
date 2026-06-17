import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingPage } from "@/components/finexa/MarketingShell";
import { Check, Sparkles, FileText, Target, Wallet, PieChart, Smartphone, ShieldCheck, Activity, Trophy, GraduationCap, CreditCard, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({ meta: [
    { title: "Features — Finexa" },
    { name: "description", content: "AI Coach, document intelligence, budgets, goals, gamification — everything your money needs in one place." },
  ]}),
  component: Features,
});

const items = [
  { i: Sparkles, t: "AI Financial Coach", d: "Context-aware guidance trained on your real spending." },
  { i: PieChart, t: "Spending Insights", d: "Personality profile, anomalies, merchant analysis." },
  { i: Wallet, t: "Budget Optimizer", d: "50/30/20 analysis with AI auto-balance." },
  { i: Target, t: "Goals Tracker", d: "Feasibility scores and income-drop simulation." },
  { i: FileText, t: "Document OCR", d: "Drop a statement. Get structure, categories, summaries." },
  { i: Smartphone, t: "UPI Analyzer", d: "Beautifully decoded UPI / bank statements." },
  { i: ShieldCheck, t: "Emergency Fund Engine", d: "Coverage gauge, readiness score, action plan." },
  { i: Activity, t: "Income Simulator", d: "Stress-test job loss, raises, side hustles." },
  { i: Trophy, t: "Habit Challenges", d: "Streaks, badges, real financial wins." },
  { i: GraduationCap, t: "Education Library", d: "Calm lessons + AI tutor for anything." },
  { i: CreditCard, t: "Virtual Cards", d: "A card for each part of your life." },
  { i: Check, t: "Bank-grade Security", d: "End-to-end encryption. SOC 2 Type II." },
];

function Features() {
  return (
    <MarketingPage>
      <section className="mx-auto max-w-5xl px-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-light">Features</p>
        <h1 className="text-display mt-4 text-5xl md:text-7xl tracking-tight text-balance">
          Everything your money needs.<br /><em className="font-normal italic">Nothing it doesn't.</em>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          A single financial operating system that quietly does the hard work in the background.
        </p>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ i: Ic, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card/60 p-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand to-brand-light grid place-items-center">
                <Ic className="h-5 w-5 text-background" />
              </div>
              <div className="text-display text-xl mt-4">{t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-32 text-center">
        <Link to="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-cta px-6 py-3 text-sm font-medium text-cta-foreground">
          Try it free <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </MarketingPage>
  );
}
