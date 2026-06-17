import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, X, ArrowRight, TrendingUp, Coffee, PiggyBank, Trophy, DollarSign, ShoppingBag, Plane } from "lucide-react";
import { AIAPI } from "@/lib/api/ai";

type Slide = {
  bg: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  headline: string;
  detail: string;
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  coffee: Coffee,
  trending: TrendingUp,
  piggy: PiggyBank,
  trophy: Trophy,
  dollar: DollarSign,
  shopping: ShoppingBag,
  plane: Plane,
};

const BG_PALETTE = [
  "from-brand to-brand-light",
  "from-cta to-[oklch(0.6_0.2_30)]",
  "from-[oklch(0.4_0.15_265)] to-brand",
  "from-brand-light to-[oklch(0.7_0.18_160)]",
  "from-cta to-brand",
];

const FALLBACK_SLIDES: Slide[] = [
  {
    bg: "from-brand to-brand-light",
    icon: Sparkles,
    eyebrow: "Your money story",
    headline: "Let's rewind.",
    detail: "A 60-second look at how you spent, saved, and grew.",
  },
  {
    bg: "from-cta to-[oklch(0.6_0.2_30)]",
    icon: Coffee,
    eyebrow: "Top category",
    headline: "Add transactions to unlock",
    detail: "Upload a statement or add expenses to see your top spending category here.",
  },
  {
    bg: "from-brand-light to-[oklch(0.7_0.18_160)]",
    icon: PiggyBank,
    eyebrow: "Savings snapshot",
    headline: "Track your progress",
    detail: "Your savings highlights will appear once you have enough data.",
  },
];

function mapApiSlides(data: any): Slide[] {
  if (!data || !data.slides || !Array.isArray(data.slides) || data.slides.length === 0) {
    return FALLBACK_SLIDES;
  }

  return data.slides.map((s: any, i: number) => ({
    bg: BG_PALETTE[i % BG_PALETTE.length],
    icon: ICON_MAP[s.icon] || ICON_MAP[Object.keys(ICON_MAP)[i % Object.keys(ICON_MAP).length]],
    eyebrow: s.eyebrow || s.label || `Slide ${i + 1}`,
    headline: s.headline || s.title || "",
    detail: s.detail || s.description || "",
  }));
}

export function MoneyReplay() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  const { data: replayData } = useQuery({
    queryKey: ["money-replay"],
    queryFn: () => AIAPI.getMoneyReplay(),
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });

  const slides = mapApiSlides(replayData);
  const s = slides[i] || slides[0];
  const Icon = s.icon;
  const last = i === slides.length - 1;

  const replayTitle = replayData?.title || "Money Replay";

  return (
    <>
      <button
        onClick={() => { setI(0); setOpen(true); }}
        className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-brand/30 via-brand/10 to-cta/20 p-5 text-left backdrop-blur-xl transition-all hover:border-white/20"
      >
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-brand-light">New</div>
          <div className="text-display text-xl mt-1">{replayTitle}</div>
          <div className="text-xs text-muted-foreground mt-1">Your money story — 60 seconds.</div>
        </div>
        <div className="rounded-full bg-foreground p-2.5 text-background transition-transform group-hover:scale-105">
          <ArrowRight className="h-4 w-4" />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-xl p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md aspect-[9/14] overflow-hidden rounded-3xl border border-white/15 shadow-2xl"
            >
              {/* progress */}
              <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
                {slides.map((_, idx) => (
                  <div key={idx} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20">
                    <motion.div
                      key={`${i}-${idx}`}
                      initial={{ width: idx < i ? "100%" : "0%" }}
                      animate={{ width: idx <= i ? "100%" : "0%" }}
                      transition={{ duration: idx === i ? 4.5 : 0.3, ease: "linear" }}
                      onAnimationComplete={() => {
                        if (idx === i && !last) setI(i + 1);
                      }}
                      className="h-full bg-white"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => setOpen(false)}
                className="absolute right-4 top-6 z-20 rounded-full bg-black/30 p-1.5 text-white backdrop-blur"
              >
                <X className="h-4 w-4" />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5 }}
                  className={`absolute inset-0 bg-gradient-to-br ${s.bg}`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
                  <div className="relative flex h-full flex-col justify-between p-8 text-white">
                    <div>
                      <Icon className="h-8 w-8 opacity-80" />
                    </div>
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15, duration: 0.5 }}
                    >
                      <div className="text-[11px] uppercase tracking-[0.2em] opacity-80">{s.eyebrow}</div>
                      <div className="mt-3 text-display text-4xl leading-[1.05]">{s.headline}</div>
                      <div className="mt-4 text-sm opacity-90 max-w-[28ch]">{s.detail}</div>
                    </motion.div>
                    <div className="flex items-center justify-between text-xs opacity-70">
                      <span>Finexa · Money Replay</span>
                      <span>{i + 1} / {slides.length}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* tap zones */}
              <button
                aria-label="Previous"
                onClick={() => setI(Math.max(0, i - 1))}
                className="absolute inset-y-0 left-0 z-10 w-1/3"
              />
              <button
                aria-label="Next"
                onClick={() => last ? setOpen(false) : setI(i + 1)}
                className="absolute inset-y-0 right-0 z-10 w-1/3"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
