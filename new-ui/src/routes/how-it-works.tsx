import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingPage } from "@/components/finexa/MarketingShell";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [
    { title: "How it works — Finexa" },
    { name: "description", content: "Connect your money, meet your AI Coach, and watch your finances become calm." },
  ]}),
  component: How,
});

const steps = [
  { n: "01", t: "Connect or upload", d: "Securely link accounts or upload statements. Bank-grade encryption, end-to-end." },
  { n: "02", t: "Meet your Companion", d: "Our AI reads your last 90 days and quietly builds your financial picture." },
  { n: "03", t: "Set goals & guardrails", d: "Emergency fund, travel, that thing you've been putting off — Finexa plans it." },
  { n: "04", t: "Live calmer", d: "Daily briefings, gentle nudges, and one place that just makes sense." },
];

function How() {
  return (
    <MarketingPage>
      <section className="mx-auto max-w-5xl px-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-light">How it works</p>
        <h1 className="text-display mt-4 text-5xl md:text-7xl tracking-tight text-balance">
          From <em className="font-normal italic">chaos</em> to clarity in four steps.
        </h1>
      </section>

      <section className="mx-auto mt-20 max-w-4xl px-6 space-y-6">
        {steps.map((s) => (
          <div key={s.n} className="flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-8 md:flex-row md:items-center md:gap-10">
            <div className="text-display text-6xl text-brand-light/70 md:w-32">{s.n}</div>
            <div>
              <div className="text-display text-3xl">{s.t}</div>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="px-6 py-32 text-center">
        <Link to="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-cta px-6 py-3 text-sm font-medium text-cta-foreground">
          Get started free <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </MarketingPage>
  );
}
