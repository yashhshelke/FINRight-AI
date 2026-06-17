import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingPage } from "@/components/finexa/MarketingShell";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [
    { title: "Pricing — Finexa" },
    { name: "description", content: "Simple, honest pricing. Start free. Upgrade when you need more." },
  ]}),
  component: Pricing,
});

const plans = [
  { name: "Starter", price: "Free", features: ["Up to 3 accounts","Manual entry","Basic insights","Mobile app"], cta: "Start free" },
  { name: "Pro", price: "$9", sub: "/mo", features: ["Unlimited accounts","AI Coach","Document OCR","Goals & simulator","Priority support"], cta: "Try Pro free", highlight: true },
  { name: "Family", price: "$19", sub: "/mo", features: ["Everything in Pro","Up to 5 members","Shared goals","Family insights"], cta: "Choose Family" },
];

function Pricing() {
  return (
    <MarketingPage>
      <section className="mx-auto max-w-5xl px-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-light">Pricing</p>
        <h1 className="text-display mt-4 text-5xl md:text-7xl tracking-tight text-balance">Honest, like good money habits.</h1>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">No hidden fees, no surprise upcharges. Cancel anytime.</p>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-3xl border bg-card/60 p-8 ${p.highlight ? "border-brand-light shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--brand-light)_40%,transparent)]" : "border-border"}`}>
              <div className="text-display text-2xl">{p.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-display text-5xl">{p.price}</span>
                <span className="text-muted-foreground">{p.sub}</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="h-4 w-4 text-success mt-0.5" />{f}</li>
                ))}
              </ul>
              <Link to="/auth/register" className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium ${p.highlight ? "bg-cta text-cta-foreground" : "bg-foreground text-background"}`}>
                {p.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="py-32" />
    </MarketingPage>
  );
}
