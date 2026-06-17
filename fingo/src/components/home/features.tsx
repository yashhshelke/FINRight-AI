"use client";

import { motion } from "framer-motion";
import {
  PieChart,
  TrendingUp,
  Target,
  Brain,
  Receipt,
  HeartPulse,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";

const features = [
  {
    icon: PieChart,
    title: "Budget Management",
    description:
      "Create intelligent budgets that adapt to your spending patterns. Set limits, track progress, and stay on course effortlessly.",
    color: "text-brand-light",
  },
  {
    icon: TrendingUp,
    title: "Cash Flow Analysis",
    description:
      "Visualize income and expenses in real-time. Understand where your money flows and identify opportunities to optimize.",
    color: "text-brand-light",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description:
      "Set meaningful financial goals and watch your progress. From emergency funds to dream purchases, every milestone matters.",
    color: "text-cta",
  },
  {
    icon: Brain,
    title: "AI Financial Guidance",
    description:
      "Get personalized advice powered by advanced AI. Ask questions, receive insights, and make confident financial decisions.",
    color: "text-brand-light",
  },
  {
    icon: Receipt,
    title: "Smart Spending Insights",
    description:
      "Uncover hidden patterns in your spending. AI categorizes transactions and highlights areas for improvement.",
    color: "text-brand-light",
  },
  {
    icon: HeartPulse,
    title: "Financial Health Monitoring",
    description:
      "Track your overall financial wellness with a comprehensive health score. Know where you stand and how to improve.",
    color: "text-success",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 text-center"
        >
          <p className="text-sm font-medium tracking-widest text-brand-light uppercase">
            Everything you need
          </p>
          <h2 className="mt-4 font-sans text-4xl font-semibold tracking-tight text-text-primary md:text-5xl">
            A complete financial
            <br />
            <span className="text-text-secondary">operating system.</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <GlassCard className="h-full">
                <feature.icon size={22} className={feature.color} />
                <h3 className="mt-4 text-lg font-medium text-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
