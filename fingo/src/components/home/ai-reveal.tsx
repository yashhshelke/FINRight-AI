"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  Target,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { formatCurrency } from "@/lib/utils";
import { useMousePosition } from "@/hooks/use-mouse-position";

const AICompanion = dynamic(
  () => import("@/components/companion/ai-companion").then((m) => m.AICompanion),
  { ssr: false }
);

const floatingCards = [
  {
    icon: Wallet,
    label: "Total Balance",
    value: formatCurrency(48250),
    change: "+12.4%",
    position: "top-[15%] left-[8%] md:left-[12%]",
    delay: 0,
  },
  {
    icon: PiggyBank,
    label: "Monthly Savings",
    value: formatCurrency(2840),
    change: "+8.2%",
    position: "top-[20%] right-[8%] md:right-[10%]",
    delay: 0.1,
  },
  {
    icon: TrendingUp,
    label: "Cash Flow",
    value: "+$3,420",
    change: "Positive",
    position: "top-[45%] left-[5%] md:left-[8%]",
    delay: 0.2,
  },
  {
    icon: BarChart3,
    label: "Budget Usage",
    value: "68%",
    change: "On track",
    position: "top-[50%] right-[5%] md:right-[8%]",
    delay: 0.3,
  },
  {
    icon: Sparkles,
    label: "AI Insights",
    value: "3 new",
    change: "View",
    position: "bottom-[25%] left-[10%] md:left-[15%]",
    delay: 0.4,
  },
  {
    icon: Target,
    label: "Goal Progress",
    value: "74%",
    change: "Emergency Fund",
    position: "bottom-[20%] right-[10%] md:right-[14%]",
    delay: 0.5,
  },
];

export function AIReveal() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const robotScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.15, 1.05]);
  const { x: mouseX, y: mouseY } = useMousePosition();

  return (
    <section ref={sectionRef} className="relative min-h-screen py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <p className="text-sm font-medium tracking-widest text-brand-light uppercase">
            Meet your guide
          </p>
          <h2 className="mt-4 font-sans text-4xl font-semibold tracking-tight text-text-primary md:text-5xl">
            Intelligence that understands
            <br />
            <span className="text-text-secondary">your finances.</span>
          </h2>
        </motion.div>

        <div className="relative mx-auto h-[600px] max-w-5xl">
          <motion.div
            style={{ scale: robotScale }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-[450px] w-[450px]">
              <AICompanion mouseX={mouseX} mouseY={mouseY} className="h-full w-full" />
            </div>
          </motion.div>

          {floatingCards.map((card) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: card.delay }}
              className={`absolute ${card.position} z-10 w-48 md:w-56`}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4 + card.delay * 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <GlassCard glow className="backdrop-blur-xl">
                  <div className="flex items-start justify-between">
                    <card.icon size={18} className="text-brand-light" />
                    <span className="text-xs text-success">{card.change}</span>
                  </div>
                  <p className="mt-3 text-xs text-text-secondary">{card.label}</p>
                  <p className="mt-1 text-lg font-medium text-text-primary">{card.value}</p>
                </GlassCard>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
