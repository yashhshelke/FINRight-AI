import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, Target, Sparkles, PieChart, Wallet,
  Smartphone, FileText, ShieldCheck, Activity, Trophy, GraduationCap,
  CreditCard, Settings, Receipt, Search, Sun, Moon, LogOut, ChevronRight,
  ClipboardList,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { NotificationsPanel } from "./NotificationsPanel";

const NAV: { group: string; items: { to: string; label: string; icon: any }[] }[] = [
  {
    group: "Money",
    items: [
      { to: "/app", label: "Overview", icon: LayoutDashboard },
      { to: "/app/transactions", label: "Transactions", icon: ArrowLeftRight },
      { to: "/app/goals", label: "Goals", icon: Target },
      { to: "/app/insights", label: "Insights", icon: PieChart },
      { to: "/app/budget", label: "Budget", icon: Wallet },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { to: "/app/coach", label: "AI Coach", icon: Sparkles },
      { to: "/app/documents", label: "Documents", icon: FileText },
      { to: "/app/upi", label: "UPI Analyzer", icon: Smartphone },
      { to: "/app/simulator", label: "Income Sim", icon: Activity },
      { to: "/app/emergency", label: "Emergency Fund", icon: ShieldCheck },
    ],
  },
  {
    group: "You",
    items: [
      { to: "/app/challenges", label: "Challenges", icon: Trophy },
      { to: "/app/learn", label: "Learn", icon: GraduationCap },
      { to: "/app/reports", label: "Reports", icon: ClipboardList },
      { to: "/app/cards", label: "Cards", icon: CreditCard },
      { to: "/app/billing", label: "Billing", icon: Receipt },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("finexa_theme");
      if (stored === "light") return "light";
    }
    return "dark";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    if (typeof window !== "undefined") {
      localStorage.setItem("finexa_theme", theme);
    }
  }, [theme]);

  const displayName =
    user ? `${user.first_name || user.username || ""}`.trim() || user.username || "You" : "You";
  const displayEmail = user?.email || "";
  const initials = displayName.charAt(0).toUpperCase();
  const aiCredits = user?.ai_credits ?? 0;

  function handleLogout() {
    logout();
    navigate({ to: "/auth/login" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="hidden md:flex sticky top-0 h-screen w-64 flex-col border-r border-border bg-surface/40 backdrop-blur-xl">
          <div className="px-5 py-5">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative h-7 w-7">
                <div className="absolute inset-0 rounded-md bg-gradient-to-br from-brand-light to-brand" />
                <div className="absolute inset-[2px] rounded-[5px] bg-background grid place-items-center">
                  <span className="text-display text-[15px] leading-none text-foreground">F</span>
                </div>
              </div>
              <span className="text-display text-xl tracking-tight">Finexa</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-6">
            {NAV.map((g) => (
              <div key={g.group}>
                <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {g.group}
                </div>
                <ul className="space-y-0.5">
                  {g.items.map((it) => {
                    const active = pathname === it.to;
                    const Icon = it.icon;
                    return (
                      <li key={it.to}>
                        <Link
                          to={it.to}
                          className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                            active
                              ? "bg-foreground/10 text-foreground"
                              : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{it.label}</span>
                          {active && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-light to-brand grid place-items-center text-background text-sm font-bold">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{displayName}</div>
                <div className="text-xs text-muted-foreground truncate">{displayEmail}</div>
              </div>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground" title="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            {aiCredits > 0 && (
              <div className="mt-2 px-2">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>AI Credits</span>
                  <span>{(aiCredits / 1000).toFixed(0)}k</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full bg-gradient-to-r from-brand to-brand-light"
                    style={{ width: `${Math.min(100, (aiCredits / 100000) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-6">
            <div className="md:hidden text-display text-lg">Finexa</div>
            <div className="relative ml-auto flex w-full max-w-md items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search transactions, goals, insights…"
                className="w-full rounded-full border border-border bg-surface/60 py-1.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-foreground/30"
              />
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground"
              title="Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <NotificationsPanel />
            <Link
              to="/app/coach"
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
            >
              <Sparkles className="h-3.5 w-3.5" /> Ask Finexa
            </Link>
          </header>
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 py-6 md:px-8 md:py-8"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 flex flex-wrap items-end justify-between gap-4"
    >
      <div className="min-w-0">
        <h1 className="text-display text-3xl md:text-4xl tracking-tight">{title}</h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-1 text-sm text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {action}
    </motion.div>
  );
}

export function Card({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.25 } }}
      className={`rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.45)] transition-colors hover:border-white/20 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function Stat({ label, value, delta, accent }: { label: string; value: string; delta?: string; accent?: "up" | "down" | "neutral" }) {
  const color = accent === "up" ? "text-success" : accent === "down" ? "text-error" : "text-muted-foreground";
  return (
    <Card>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-2 text-display text-3xl tracking-tight"
      >
        {value}
      </motion.div>
      {delta && <div className={`mt-1 text-xs ${color}`}>{delta}</div>}
    </Card>
  );
}
