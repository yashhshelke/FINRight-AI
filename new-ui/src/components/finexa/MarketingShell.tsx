import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function MarketingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-full border border-border bg-background/60 px-5 py-2.5 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative h-7 w-7">
            <div className="absolute inset-0 rounded-md bg-gradient-to-br from-brand-light to-brand" />
            <div className="absolute inset-[2px] rounded-[5px] bg-background grid place-items-center">
              <span className="text-display text-[15px] leading-none">F</span>
            </div>
          </div>
          <span className="text-display text-xl tracking-tight">Finexa</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/features" className="hover:text-foreground">Features</Link>
          <Link to="/how-it-works" className="hover:text-foreground">How it works</Link>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/faq" className="hover:text-foreground">FAQ</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
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

export function MarketingFooter() {
  return (
    <footer className="border-t border-border px-6 py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <div className="text-display text-2xl">Finexa</div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            The AI-powered personal finance operating system.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-12 text-sm">
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Product</div>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-foreground/80 hover:text-foreground">Features</Link></li>
              <li><Link to="/pricing" className="text-foreground/80 hover:text-foreground">Pricing</Link></li>
              <li><Link to="/how-it-works" className="text-foreground/80 hover:text-foreground">How it works</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Company</div>
            <ul className="space-y-2">
              <li><Link to="/contact" className="text-foreground/80 hover:text-foreground">Contact</Link></li>
              <li><Link to="/faq" className="text-foreground/80 hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Account</div>
            <ul className="space-y-2">
              <li><Link to="/auth/login" className="text-foreground/80 hover:text-foreground">Sign in</Link></li>
              <li><Link to="/auth/register" className="text-foreground/80 hover:text-foreground">Sign up</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl items-center justify-between border-t border-border pt-6 text-xs text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} Finexa AI</span>
        <span>Bank‑grade encryption · SOC 2 Type II</span>
      </div>
    </footer>
  );
}

export function MarketingPage({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <MarketingNav />
      <div className="relative z-10 pt-32">{children}</div>
      <MarketingFooter />
    </main>
  );
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-brand/15 blur-[120px]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 flex items-center justify-center gap-2">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-md bg-gradient-to-br from-brand-light to-brand" />
              <div className="absolute inset-[2px] rounded-[5px] bg-background grid place-items-center">
                <span className="text-display text-[17px] leading-none">F</span>
              </div>
            </div>
            <span className="text-display text-2xl">Finexa</span>
          </Link>
          <div className="rounded-3xl border border-border bg-card/60 p-8 backdrop-blur-xl">
            <h1 className="text-display text-3xl tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
