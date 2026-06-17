"use client";

import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMousePosition } from "@/hooks/use-mouse-position";

const AICompanion = dynamic(
  () => import("@/components/companion/ai-companion").then((m) => m.AICompanion),
  { ssr: false }
);

const ParticleField = dynamic(
  () => import("@/components/shared/particles").then((m) => m.ParticleField),
  { ssr: false }
);

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const robotScale = useTransform(scrollYProgress, [0, 1], [0.7, 1.3]);
  const robotY = useTransform(scrollYProgress, [0, 1], [80, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const headlineY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const { x: mouseX, y: mouseY } = useMousePosition();

  return (
    <section ref={containerRef} className="relative min-h-[200vh]">
      <ParticleField className="pointer-events-none absolute inset-0 opacity-60" />
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        <motion.div style={{ opacity }} className="relative z-10 text-center px-6">
          <motion.div style={{ y: headlineY }}>
            <p className="mb-4 text-sm font-medium tracking-widest text-brand-light uppercase">
              Personal Finance OS
            </p>
            <h1 className="mx-auto max-w-4xl font-sans text-5xl font-semibold leading-[1.1] tracking-tight text-text-primary md:text-7xl">
              Track your money.
              <br />
              <span className="text-text-secondary">Build your future.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-text-secondary">
              Your personal finance operating system powered by intelligent insights.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button variant="cta" size="lg" asChild>
                <Link href="/register">Start Free</Link>
              </Button>
              <Button variant="glass" size="lg" className="gap-2">
                <Play size={16} />
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          style={{ scale: robotScale, y: robotY }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="h-[500px] w-[500px] md:h-[600px] md:w-[600px]">
            <AICompanion mouseX={mouseX} mouseY={mouseY} scale={1} className="h-full w-full" />
          </div>
        </motion.div>

        <motion.div
          style={{ opacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-text-secondary">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-8 w-5 rounded-full border border-white/20 p-1"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-brand-light mx-auto" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
