import { createFileRoute } from "@tanstack/react-router";
import { MarketingPage } from "@/components/finexa/MarketingShell";
import { Mail, MessageSquare, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact — Finexa" },
    { name: "description", content: "Talk to a human at Finexa. We'd love to hear from you." },
  ]}),
  component: Contact,
});

function Contact() {
  return (
    <MarketingPage>
      <section className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-light">Contact</p>
          <h1 className="text-display mt-4 text-5xl md:text-7xl tracking-tight text-balance">Let's talk.</h1>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-[1fr_320px]">
          <form className="rounded-2xl border border-border bg-card/60 p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <div className="text-xs text-muted-foreground mb-1">Name</div>
                <input className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none" />
              </label>
              <label className="block">
                <div className="text-xs text-muted-foreground mb-1">Email</div>
                <input type="email" className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none" />
              </label>
            </div>
            <label className="block">
              <div className="text-xs text-muted-foreground mb-1">Subject</div>
              <input className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none" />
            </label>
            <label className="block">
              <div className="text-xs text-muted-foreground mb-1">Message</div>
              <textarea rows={5} className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none" />
            </label>
            <button type="button" className="rounded-full bg-cta px-5 py-2.5 text-sm font-medium text-cta-foreground">Send message</button>
          </form>

          <div className="space-y-3">
            {[
              { i: Mail, t: "Email", d: "hello@finexa.ai" },
              { i: MessageSquare, t: "Chat", d: "Mon–Fri · 9am–6pm ET" },
              { i: MapPin, t: "Offices", d: "New York · Lisbon" },
            ].map(({ i: Ic, t, d }) => (
              <div key={t} className="rounded-2xl border border-border bg-card/60 p-5">
                <div className="flex items-center gap-3">
                  <Ic className="h-4 w-4 text-brand-light" />
                  <div>
                    <div className="text-sm">{t}</div>
                    <div className="text-xs text-muted-foreground">{d}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-32" />
    </MarketingPage>
  );
}
