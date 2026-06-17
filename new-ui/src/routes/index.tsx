import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Play, Shield, Zap, Globe } from "lucide-react";
import { Companion, CompanionStage, CursorGlow } from "@/components/finexa/Companion";
import {
  FeatureGrid,
  DashboardPreview,
  AssistantPreview,
} from "@/components/finexa/Sections";
import { ScrollScene } from "@/components/finexa/ScrollScene";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Finexa \u2014 AI-Powered Personal Finance" },
      {
        name: "description",
        content:
          "Finexa is the AI-powered personal finance operating system. Track spending, manage budgets, monitor cash flow and build long-term financial wellness.",
      },
      { property: "og:title", content: "Finexa \u2014 AI-Powered Personal Finance" },
      {
        property: "og:description",
        content: "Track, budget, plan and grow \u2014 beautifully. The premium financial OS, powered by AI.",
      },
    ],
  }),
  component: Index,
});

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="relative h-7 w-7">
        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-brand-light to-brand" />
        <div className="absolute inset-[2px] rounded-[5px] bg-background grid place-items-center">
          <span className="text-display text-[15px] leading-none text-foreground">F</span>
        </div>
      </div>
      <span className="text-display text-xl tracking-tight">Finexa</span>
    </Link>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-full border border-border bg-background/60 px-5 py-2.5 backdrop-blur-xl">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/features" className="hover:text-foreground">Features</Link>
          <Link to="/how-it-works" className="hover:text-foreground">How it works</Link>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/faq" className="hover:text-foreground">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth/login" className="hidden text-sm text-muted-foreground hover:text-foreground md:inline">
            Sign in
          </Link>
          <Link
            to="/auth/register"
            className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-32">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
          AI-Powered Financial Intelligence
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="text-display mt-8 text-6xl leading-[0.98] tracking-tight text-balance md:text-8xl"
        >
          Your money,
          <br />
          <em className="font-normal italic text-foreground/90">intelligently managed.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25 }}
          className="mx-auto mt-7 max-w-xl text-base text-muted-foreground md:text-lg"
        >
          AI-powered financial coaching &mdash; real-time health scoring, smart budgeting, risk
          simulations, and 100,000 free AI credits from day one.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/auth/register"
            className="group inline-flex items-center gap-2 rounded-full bg-cta px-6 py-3 text-sm font-medium text-cta-foreground shadow-[0_10px_40px_-10px_color-mix(in_oklab,var(--cta)_50%,transparent)] transition-all hover:scale-[1.02]"
          >
            Start free &mdash; 100k credits
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-6 py-3 text-sm text-foreground backdrop-blur transition-colors hover:bg-surface"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            See how it works
          </Link>
        </motion.div>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Bank-grade privacy</span>
          <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> No credit card needed</span>
          <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> Works with any bank</span>
        </div>

        {/* companion peek */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.6 }}
          className="mt-20 flex justify-center"
        >
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -translate-y-10 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <Companion size={260} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StoryReveal() {
  return (
    <section className="relative px-6 py-32">
      <div className="mx-auto mb-20 max-w-3xl text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-light">Meet your AI coach</p>
        <h2 className="text-display mt-4 text-5xl md:text-6xl text-balance">
          Not a chatbot. <em className="font-normal italic">A guide.</em>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Finexa watches your numbers so you don&apos;t have to. Calm, private, always present &mdash; quietly
          turning data into the next right move.
        </p>
      </div>
      <CompanionStage />
    </section>
  );
}

function StatsAndTestimonials() {
  return (
    <section className="relative px-6 py-32">
      <div className="mx-auto max-w-6xl">
        {/* Stats bar */}
        <div className="mb-20 grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { value: "50k+", label: "Active users" },
            { value: "100k", label: "Free AI credits" },
            { value: "\u20B918k", label: "Avg monthly savings" },
            { value: "94%", label: "Users saving more" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-display text-4xl text-brand-light">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              name: "Priya Sharma",
              role: "Software Engineer, Bengaluru",
              quote: "I saved \u20B924,000 in the first two months just by following the AI suggestions. The health score keeps me accountable.",
              metric: "\u20B924K saved",
            },
            {
              name: "Rahul Mehta",
              role: "Freelancer, Mumbai",
              quote: "The UPI analyser caught irregular merchant charges I had completely missed. Worth every rupee.",
              metric: "3 leaks found",
            },
            {
              name: "Ananya Patel",
              role: "Product Manager, Hyderabad",
              quote: "Finexa is the first finance app that actually explains what to do instead of just showing charts.",
              metric: "94% health score",
            },
          ].map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-border bg-surface/40 p-6 backdrop-blur"
            >
              <p className="text-sm leading-relaxed text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-light to-brand grid place-items-center text-background text-xs font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <div className="text-display text-xl text-brand-light">{t.metric}</div>
                <div className="text-[10px] text-muted-foreground">Key result</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative px-6 py-32">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[36px] border border-border bg-surface p-16 text-center">
        <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-40" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/30 blur-3xl" />
        <div className="relative">
          <h2 className="text-display text-5xl md:text-6xl text-balance">
            Take control of your <em className="font-normal italic">financial future.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-muted-foreground">
            Join thousands of people building real wealth with AI &mdash; no credit card required.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 rounded-full bg-cta px-6 py-3 text-sm font-medium text-cta-foreground"
            >
              Start free &mdash; 100k credits <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-6 py-3 text-sm text-foreground"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            The AI-powered personal finance operating system.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-12 text-sm">
          {[
            ["Product", ["Features", "Pricing", "How it Works", "Security"]],
            ["Company", ["About", "Contact", "Careers", "Press"]],
            ["Resources", ["Help", "FAQ", "API", "Status"]],
          ].map(([h, items]) => (
            <div key={h as string}>
              <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">{h}</div>
              <ul className="space-y-2">
                {(items as string[]).map((i) => (
                  <li key={i}>
                    <a href="#" className="text-foreground/80 hover:text-foreground">{i}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl items-center justify-between border-t border-border pt-6 text-xs text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} Finexa AI</span>
        <span>Bank-grade encryption &middot; Privacy first</span>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <CursorGlow />
      <Nav />
      <div className="relative z-10">
        <Hero />
        <ScrollScene />
        <StoryReveal />
        <FeatureGrid />
        <DashboardPreview />
        <AssistantPreview />
        <StatsAndTestimonials />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
