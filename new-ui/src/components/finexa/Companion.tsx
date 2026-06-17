import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import companionImg from "@/assets/finexa-companion.png";

export function Companion({ size = 380 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(x, { stiffness: 60, damping: 18 });
  const ry = useSpring(y, { stiffness: 60, damping: 18 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / window.innerWidth;
      const dy = (e.clientY - cy) / window.innerHeight;
      x.set(Math.max(-1, Math.min(1, dx)) * 18);
      y.set(Math.max(-1, Math.min(1, dy)) * 14);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);

  return (
    <div ref={ref} className="relative" style={{ width: size, height: size }}>
      {/* glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-60 animate-pulse-glow"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, color-mix(in oklab, var(--brand-light) 55%, transparent), transparent 60%)",
        }}
      />
      {/* floor reflection */}
      <div
        className="absolute left-1/2 bottom-2 h-6 w-2/3 -translate-x-1/2 rounded-[50%] blur-2xl opacity-50"
        style={{ background: "color-mix(in oklab, var(--brand-light) 50%, transparent)" }}
      />
      <motion.img
        src={companionImg}
        alt="Finexa AI companion"
        width={1024}
        height={1024}
        className="relative h-full w-full object-contain select-none animate-float"
        style={{ x: rx, y: ry, filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.6))" }}
        draggable={false}
      />
    </div>
  );
}

function FloatingCard({
  className = "",
  delay = 0,
  children,
  float = "float",
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
  float?: "float" | "float-2";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute glass-strong rounded-2xl p-4 shadow-2xl animate-${float} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function CompanionStage() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.05, 1.15]);
  const blurOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.7, 0.4]);

  return (
    <div ref={ref} className="relative mx-auto flex h-[640px] w-full max-w-6xl items-center justify-center">
      <motion.div
        className="absolute inset-0 grid-bg radial-fade"
        style={{ opacity: blurOpacity }}
      />
      <motion.div style={{ scale }} className="relative">
        <Companion size={440} />
      </motion.div>

      {/* floating financial cards */}
      <FloatingCard className="left-2 top-10 w-56" delay={0.1}>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Balance</div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">{"\u20B9"}2,84,212</div>
        <div className="mt-1 flex items-center gap-1 text-xs text-success">
          <span>{"\u2191"} 12.4%</span>
          <span className="text-muted-foreground">this month</span>
        </div>
      </FloatingCard>

      <FloatingCard className="right-2 top-16 w-60" delay={0.25} float="float-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cash Flow</div>
          <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
        </div>
        <svg viewBox="0 0 200 60" className="mt-2 h-14 w-full">
          <defs>
            <linearGradient id="cf" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--brand-light)" stopOpacity="0.5" />
              <stop offset="1" stopColor="var(--brand-light)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,40 C30,30 50,45 80,30 C110,15 140,35 200,18 L200,60 L0,60 Z" fill="url(#cf)" />
          <path d="M0,40 C30,30 50,45 80,30 C110,15 140,35 200,18" stroke="var(--brand-light)" strokeWidth="1.5" fill="none" />
        </svg>
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Net</span>
          <span className="tabular-nums font-medium">+{"\u20B9"}30,500</span>
        </div>
      </FloatingCard>

      <FloatingCard className="left-6 bottom-20 w-52" delay={0.4} float="float-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Budget Usage</div>
        <div className="mt-3 space-y-2">
          {[["Dining", 62], ["Travel", 38], ["Groceries", 81]].map(([k, v]) => (
            <div key={k as string}>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{k}</span>
                <span className="tabular-nums">{v}%</span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${v}%`,
                    background: "linear-gradient(90deg, var(--brand), var(--brand-light))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </FloatingCard>

      <FloatingCard className="right-6 bottom-24 w-60" delay={0.55}>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-light to-brand grid place-items-center text-[10px]">✦</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">AI Insight</div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-foreground/90">
          You&apos;re on track to save <span className="font-semibold text-success">{"\u20B9"}12,400</span> more this month if you skip
          two dining-outs.
        </p>
      </FloatingCard>

      <FloatingCard className="left-1/2 -translate-x-1/2 -top-2 w-44" delay={0.7}>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Goal - MacBook</div>
        <div className="mt-2 flex items-end justify-between">
          <span className="text-lg font-semibold tabular-nums">{"\u20B9"}67,000</span>
          <span className="text-xs text-muted-foreground">/ {"\u20B9"}90,000</span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full w-[76%] rounded-full bg-gradient-to-r from-brand to-brand-light" />
        </div>
      </FloatingCard>
    </div>
  );
}

export function CursorGlow() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 transition-opacity"
      style={{
        background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, color-mix(in oklab, var(--brand-light) 10%, transparent), transparent 60%)`,
      }}
    />
  );
}
