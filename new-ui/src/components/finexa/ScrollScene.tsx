import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import { Companion } from "@/components/finexa/Companion";
import { TrendingUp, PiggyBank, Sparkles, Target } from "lucide-react";

export function ScrollScene() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 22, mass: 0.4 });

  const scale = useTransform(smooth, [0, 0.5, 1], [0.85, 1.15, 0.9]);
  const rotate = useTransform(smooth, [0, 1], [-6, 6]);
  const glow = useTransform(smooth, [0, 0.5, 1], [0.3, 0.7, 0.3]);

  // widgets fly in from edges
  const wA = {
    x: useTransform(smooth, [0.1, 0.55], [-200, 0]),
    o: useTransform(smooth, [0.1, 0.45], [0, 1]),
    y: useTransform(smooth, [0.1, 0.55], [40, 0]),
  };
  const wB = {
    x: useTransform(smooth, [0.15, 0.6], [220, 0]),
    o: useTransform(smooth, [0.15, 0.5], [0, 1]),
    y: useTransform(smooth, [0.15, 0.6], [-30, 0]),
  };
  const wC = {
    x: useTransform(smooth, [0.2, 0.65], [-260, 0]),
    o: useTransform(smooth, [0.2, 0.55], [0, 1]),
    y: useTransform(smooth, [0.2, 0.65], [-50, 0]),
  };
  const wD = {
    x: useTransform(smooth, [0.25, 0.7], [240, 0]),
    o: useTransform(smooth, [0.25, 0.6], [0, 1]),
    y: useTransform(smooth, [0.25, 0.7], [60, 0]),
  };

  return (
    <section ref={ref} className="relative h-[220vh] px-6">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* ambient glow tied to scroll */}
        <motion.div
          style={{ opacity: glow }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/30 blur-[140px]"
        />
        <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-30" />

        {/* Eyebrow */}
        <motion.p
          style={{ opacity: useTransform(smooth, [0, 0.15, 0.6, 0.8], [0, 1, 1, 0]) }}
          className="absolute top-[14%] left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.25em] text-brand-light"
        >
          A calmer way to see your money
        </motion.p>

        {/* Companion */}
        <motion.div style={{ scale, rotate }} className="relative">
          <Companion size={340} />
        </motion.div>

        {/* Floating widgets */}
        <FloatWidget
          style={{ x: wA.x, y: wA.y, opacity: wA.o }}
          className="left-[6%] top-[22%]"
          icon={TrendingUp}
          eyebrow="Cash flow"
          value={"+\u20B930,500"}
          sub="Net this month - 36% rate"
          tone="brand"
        />
        <FloatWidget
          style={{ x: wB.x, y: wB.y, opacity: wB.o }}
          className="right-[6%] top-[28%]"
          icon={Sparkles}
          eyebrow="Daily briefing"
          value="On track"
          sub={`Save \u20B92,650 \u2014 best in 6 months`}
          tone="cta"
        />
        <FloatWidget
          style={{ x: wC.x, y: wC.y, opacity: wC.o }}
          className="left-[10%] bottom-[18%]"
          icon={PiggyBank}
          eyebrow="Emergency fund"
          value="3.4 mo"
          sub="68% to goal - +0.2 this month"
          tone="brand"
        />
        <FloatWidget
          style={{ x: wD.x, y: wD.y, opacity: wD.o }}
          className="right-[8%] bottom-[22%]"
          icon={Target}
          eyebrow="Tokyo trip"
          value="42%"
          sub={`\u20B918,000 / \u20B960,000`}
          tone="cta"
        />

        {/* Headline that fades in late */}
        <motion.div
          style={{ opacity: useTransform(smooth, [0.55, 0.8], [0, 1]) }}
          className="absolute bottom-[10%] left-1/2 -translate-x-1/2 max-w-2xl text-center"
        >
          <h2 className="text-display text-4xl md:text-5xl text-balance">
            Every number, <em className="font-normal italic">in conversation.</em>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Insights, goals, and cash flow — orchestrated by a companion that actually pays attention.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function FloatWidget({
  style,
  className,
  icon: Icon,
  eyebrow,
  value,
  sub,
  tone,
}: {
  style: React.ComponentProps<typeof motion.div>["style"];
  className?: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  value: string;
  sub: string;
  tone: "brand" | "cta";
}) {
  const ring = tone === "brand" ? "from-brand-light/60 to-brand/10" : "from-cta/60 to-cta/10";
  const dot = tone === "brand" ? "bg-brand-light" : "bg-cta";
  return (
    <motion.div
      style={style}
      className={`absolute w-[260px] rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ${className ?? ""}`}
    >
      <div className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${ring} opacity-30 blur-md`} />
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-lg grid place-items-center ${dot} text-background`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div>
        </div>
        <div className="mt-3 text-display text-2xl tracking-tight">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      </div>
    </motion.div>
  );
}
