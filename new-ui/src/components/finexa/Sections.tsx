import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Target,
  Sparkles,
  PieChart,
  HeartPulse,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Budget Management",
    desc: "Adaptive budgets that learn from how you actually spend, not how you wish you did.",
  },
  {
    icon: TrendingUp,
    title: "Cash Flow Analysis",
    desc: "See every dollar flowing in, out, and forward — with forecasts you can trust.",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    desc: "From an emergency fund to a Tokyo trip — visualize every goal and the path there.",
  },
  {
    icon: Sparkles,
    title: "AI Financial Guidance",
    desc: "A private advisor in your pocket, fluent in your numbers and your ambitions.",
  },
  {
    icon: PieChart,
    title: "Smart Spending Insights",
    desc: "Discover the patterns behind your spending. Decide what to keep, cut, or grow.",
  },
  {
    icon: HeartPulse,
    title: "Financial Health Monitor",
    desc: "A live score across savings, debt, runway and resilience — updated daily.",
  },
];

export function FeatureGrid() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-32">
      <div className="mb-16 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-light">The platform</p>
        <h2 className="text-display mt-4 text-5xl md:text-6xl text-balance">
          Everything you need to <em className="font-normal italic">master</em> your money.
        </h2>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Six tightly integrated systems, designed to give you clarity, control and confidence —
          without the spreadsheet sprawl.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            className="group relative bg-background p-8 transition-colors hover:bg-surface"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-brand-light">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-6 text-lg font-medium">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            <ArrowUpRight className="absolute right-6 top-6 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function DashboardPreview() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-32">
      <div className="mb-12 flex items-end justify-between">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-light">Your dashboard</p>
          <h2 className="text-display mt-4 text-5xl text-balance">
            Your entire financial life, on one calm canvas.
          </h2>
        </div>
        <div className="hidden text-right text-sm text-muted-foreground md:block">
          <p>Real‑time sync</p>
          <p>Bank‑grade encryption</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-border bg-surface p-2 shadow-2xl"
      >
        <div className="rounded-2xl bg-background p-8">
          {/* topbar */}
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-error/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ml-4 text-xs text-muted-foreground">finexa.ai / overview</span>
            </div>
            <div className="text-xs text-muted-foreground">November 2026</div>
          </div>

          {/* stats row */}
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            {[
              ["Balance", "\u20B984,212", "+12.4%", true],
              ["Income", "\u20B985,000", "+4.2%", true],
              ["Expenses", "\u20B954,500", "-3.1%", true],
              ["Savings", "\u20B930,500", "+18.0%", true],
            ].map(([k, v, d, up]) => (
              <div key={k as string} className="bg-surface p-5">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">{v}</div>
                <div className={`mt-1 flex items-center gap-1 text-xs ${up ? "text-success" : "text-error"}`}>
                  {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {d}
                </div>
              </div>
            ))}
          </div>

          {/* charts row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cash flow</div>
                  <div className="mt-1 text-lg font-medium">Last 12 months</div>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md border border-border px-2 py-1">1M</span>
                  <span className="rounded-md border border-border px-2 py-1">6M</span>
                  <span className="rounded-md bg-foreground px-2 py-1 text-background">1Y</span>
                </div>
              </div>
              <svg viewBox="0 0 600 200" className="mt-6 h-48 w-full">
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="var(--brand-light)" stopOpacity="0.4" />
                    <stop offset="1" stopColor="var(--brand-light)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[40, 80, 120, 160].map((y) => (
                  <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.06" />
                ))}
                <path
                  d="M0,150 C50,140 80,120 120,110 C170,100 210,140 260,120 C310,100 350,70 400,60 C450,55 490,90 540,70 C570,60 590,40 600,30 L600,200 L0,200 Z"
                  fill="url(#g1)"
                />
                <path
                  d="M0,150 C50,140 80,120 120,110 C170,100 210,140 260,120 C310,100 350,70 400,60 C450,55 490,90 540,70 C570,60 590,40 600,30"
                  stroke="var(--brand-light)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M0,170 C70,165 110,160 160,155 C220,150 270,165 320,150 C370,140 420,130 470,120 C520,115 560,110 600,105"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                  fill="none"
                />
              </svg>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Spending by category</div>
              <div className="mt-5 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="14" />
                  <circle cx="60" cy="60" r="48" fill="none" stroke="var(--brand-light)" strokeWidth="14" strokeDasharray="120 300" strokeLinecap="round" />
                  <circle cx="60" cy="60" r="48" fill="none" stroke="var(--cta)" strokeWidth="14" strokeDasharray="60 300" strokeDashoffset="-120" strokeLinecap="round" />
                  <circle cx="60" cy="60" r="48" fill="none" stroke="var(--brand)" strokeWidth="14" strokeDasharray="40 300" strokeDashoffset="-180" strokeLinecap="round" />
                </svg>
              </div>
              <div className="mt-4 space-y-2 text-xs">
                {[
                  ["Housing", "\u20B918,000", "var(--brand-light)"],
                  ["Food", "\u20B912,400", "var(--cta)"],
                  ["Transit", "\u20B95,200", "var(--brand)"],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                      <span className="text-muted-foreground">{k}</span>
                    </div>
                    <span className="tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* transactions */}
          <div className="mt-6 rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="text-sm font-medium">Recent transactions</div>
              <div className="text-xs text-muted-foreground">View all →</div>
            </div>
            <div className="divide-y divide-border text-sm">
              {[
                ["Swiggy Order", "Food", "-\u20B9450", "Today"],
                ["Monthly Salary", "Income", "+\u20B985,000", "Yesterday"],
                ["Airtel Postpaid", "Utilities", "-\u20B9999", "Yesterday"],
                ["Uber India", "Transit", "-\u20B9342", "2 days ago"],
              ].map(([m, c, a, t]) => (
                <div key={m + t} className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-background grid place-items-center text-xs">
                      {(m as string)[0]}
                    </div>
                    <div>
                      <div className="font-medium">{m}</div>
                      <div className="text-xs text-muted-foreground">{c}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`tabular-nums ${(a as string).startsWith("+") ? "text-success" : ""}`}>{a}</div>
                    <div className="text-xs text-muted-foreground">{t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export function AssistantPreview() {
  const messages = [
    { role: "user", text: "How can I save more this month?" },
    {
      role: "ai",
      text:
        "Three high‑impact moves: pause two unused subscriptions ($38/mo), shift dining out from 9 → 5 visits ($180), and round‑up savings on every card swipe (~$60). Net: $278 saved.",
    },
    { role: "user", text: "Can I reach my MacBook goal by December?" },
    {
      role: "ai",
      text:
        "Yes — at your current pace you'll hit $2,400 by Dec 18. If you add $120/mo from the dining adjustment above, you'll be done by Dec 2.",
    },
  ];
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-32">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-light">AI assistant</p>
          <h2 className="text-display mt-4 text-5xl text-balance">
            A financial advisor that <em className="font-normal italic">actually</em> knows your life.
          </h2>
          <p className="mt-5 max-w-md text-muted-foreground">
            Ask anything. Finexa reasons across every transaction, goal and habit — and replies with
            answers you can act on this afternoon.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Private by design — your data never trains a public model.",
              "Cites the exact transactions behind every recommendation.",
              "Plans, scenarios and forecasts, on demand.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-muted-foreground">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-light" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="glass-strong relative overflow-hidden rounded-3xl p-6 shadow-2xl"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-white/5 text-foreground border border-border"
                  }`}
                >
                  {m.role === "ai" && (
                    <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-light">
                      <Sparkles className="h-3 w-3" /> Finexa
                    </div>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-background/60 p-3">
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Ask Finexa anything about your money…"
              />
              <button className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background">
                Ask
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
