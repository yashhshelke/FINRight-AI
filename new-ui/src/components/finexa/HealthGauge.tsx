import { motion } from "framer-motion";

function grade(score: number) {
  if (score >= 90) return { letter: "A+", tone: "Exceptional" };
  if (score >= 80) return { letter: "A", tone: "Strong" };
  if (score >= 70) return { letter: "B", tone: "Healthy" };
  if (score >= 60) return { letter: "C", tone: "Watchful" };
  return { letter: "D", tone: "At risk" };
}

export function HealthGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180;
  const g = grade(score);
  return (
    <div className="relative aspect-[2/1] w-full">
      <svg viewBox="0 0 200 110" className="w-full">
        <defs>
          <linearGradient id="hg" x1="0" x2="1">
            <stop offset="0%" stopColor="oklch(0.63 0.22 25)" />
            <stop offset="50%" stopColor="oklch(0.78 0.16 75)" />
            <stop offset="100%" stopColor="oklch(0.72 0.18 150)" />
          </linearGradient>
        </defs>
        <path d="M10 100 A90 90 0 0 1 190 100" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="14" strokeLinecap="round" />
        <motion.path
          d="M10 100 A90 90 0 0 1 190 100"
          fill="none"
          stroke="url(#hg)"
          strokeWidth="14"
          strokeLinecap="round"
          initial={{ strokeDasharray: "0 283" }}
          whileInView={{ strokeDasharray: `${(angle / 180) * 283} 283` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <div className="flex items-baseline justify-center gap-2">
          <div className="text-display text-5xl tracking-tight">{score}</div>
          <div className="text-display text-2xl text-brand-light">{g.letter}</div>
        </div>
        <div className="text-xs text-muted-foreground">{g.tone} · Financial Health</div>
      </div>
    </div>
  );
}
