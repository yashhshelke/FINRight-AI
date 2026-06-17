"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Target,
  Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { formatCurrency } from "@/lib/utils";

const transactions = [
  { name: "Whole Foods Market", category: "Groceries", amount: -84.32, date: "Today" },
  { name: "Salary Deposit", category: "Income", amount: 5200, date: "Yesterday" },
  { name: "Netflix", category: "Entertainment", amount: -15.99, date: "Mar 12" },
  { name: "Shell Gas Station", category: "Transport", amount: -52.4, date: "Mar 11" },
  { name: "Amazon", category: "Shopping", amount: -127.85, date: "Mar 10" },
];

const goals = [
  { name: "Emergency Fund", progress: 74, target: formatCurrency(15000) },
  { name: "New Laptop", progress: 42, target: formatCurrency(2400) },
  { name: "Vacation", progress: 28, target: formatCurrency(5000) },
];

export function DashboardPreview() {
  return (
    <section id="dashboard" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="text-sm font-medium tracking-widest text-brand-light uppercase">
            Dashboard
          </p>
          <h2 className="mt-4 font-sans text-4xl font-semibold tracking-tight text-text-primary md:text-5xl">
            Your finances,
            <br />
            <span className="text-text-secondary">at a glance.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        >
          {/* Dashboard header */}
          <div className="border-b border-border bg-surface px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-secondary">Good morning, Alex</p>
                <p className="text-lg font-medium text-text-primary">Dashboard</p>
              </div>
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-error/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Stats row */}
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: "Total Balance", value: formatCurrency(48250), change: "+12.4%", up: true },
                { label: "Income", value: formatCurrency(8200), change: "+3.2%", up: true },
                { label: "Expenses", value: formatCurrency(4780), change: "-5.1%", up: false },
                { label: "Savings", value: formatCurrency(2840), change: "+8.2%", up: true },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                  <p className="mt-1 text-2xl font-medium text-text-primary">{stat.value}</p>
                  <div className="mt-1 flex items-center gap-1">
                    {stat.up ? (
                      <ArrowUpRight size={14} className="text-success" />
                    ) : (
                      <ArrowDownRight size={14} className="text-error" />
                    )}
                    <span className={`text-xs ${stat.up ? "text-success" : "text-error"}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {/* Transactions */}
              <div className="lg:col-span-2 rounded-2xl border border-border bg-background p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-text-primary">Recent Transactions</h3>
                  <CreditCard size={16} className="text-text-secondary" />
                </div>
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm text-text-primary">{tx.name}</p>
                        <p className="text-xs text-text-secondary">{tx.category} · {tx.date}</p>
                      </div>
                      <span className={`text-sm font-medium ${tx.amount > 0 ? "text-success" : "text-text-primary"}`}>
                        {tx.amount > 0 ? "+" : ""}{formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goals + AI */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-background p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-text-primary">Goals</h3>
                    <Target size={16} className="text-text-secondary" />
                  </div>
                  {goals.map((goal) => (
                    <div key={goal.name} className="mb-4 last:mb-0">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-primary">{goal.name}</span>
                        <span className="text-text-secondary">{goal.target}</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-brand transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <GlassCard glow>
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-brand-light" />
                    <span className="text-sm font-medium text-text-primary">AI Insight</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    You&apos;re on track to save $340 more this month. Consider reducing dining out by 15% to reach your laptop goal faster.
                  </p>
                </GlassCard>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
