import { createFileRoute } from "@tanstack/react-router";
import { MarketingPage } from "@/components/finexa/MarketingShell";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [
    { title: "FAQ — Finexa" },
    { name: "description", content: "Answers to the most common questions about Finexa." },
  ]}),
  component: FAQ,
});

const faqs = [
  { q: "Is my data safe?", a: "Yes. We use bank-grade 256-bit encryption, never store credentials, and are SOC 2 Type II certified." },
  { q: "Can I cancel anytime?", a: "Of course. One click in Settings → Billing. No retention games." },
  { q: "Do you sell my data?", a: "Never. Our business model is your subscription — full stop." },
  { q: "Which banks do you support?", a: "We connect to 11,000+ institutions across the US, EU, UK and India via secure aggregators." },
  { q: "Is the AI Coach really useful?", a: "It's grounded in your real transactions, goals, and statements — so its advice is specific, not generic." },
  { q: "Do you have a mobile app?", a: "Yes — iOS and Android. The full experience, beautifully reimagined for touch." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <MarketingPage>
      <section className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-light">FAQ</p>
        <h1 className="text-display mt-4 text-5xl md:text-7xl tracking-tight text-balance">Real answers.</h1>
      </section>

      <section className="mx-auto mt-16 max-w-3xl px-6">
        <div className="divide-y divide-border rounded-2xl border border-border bg-card/40">
          {faqs.map((f, i) => (
            <button
              key={f.q}
              onClick={() => setOpen(open === i ? null : i)}
              className="block w-full px-6 py-5 text-left"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-display text-xl">{f.q}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </div>
              {open === i && <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>}
            </button>
          ))}
        </div>
      </section>
      <section className="py-32" />
    </MarketingPage>
  );
}
