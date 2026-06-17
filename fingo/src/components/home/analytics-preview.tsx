"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared/glass-card";
import { formatCurrency } from "@/lib/utils";

const categories = [
  { name: "Housing", amount: 1800, percent: 38, color: "bg-brand" },
  { name: "Food", amount: 620, percent: 13, color: "bg-brand-light" },
  { name: "Transport", amount: 480, percent: 10, color: "bg-cta" },
  { name: "Entertainment", amount: 340, percent: 7, color: "bg-warning" },
  { name: "Shopping", amount: 520, percent: 11, color: "bg-success" },
  { name: "Other", amount: 1020, percent: 21, color: "bg-text-secondary" },
];

const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const incomeData = [7200, 7400, 7800, 8100, 8000, 8200];
const expenseData = [5100, 4900, 5200, 4800, 4600, 4780];

export function AnalyticsPreview() {
  const maxVal = Math.max(...incomeData, ...expenseData);

  return (
    <section id="analytics" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="text-sm font-medium tracking-widest text-brand-light uppercase">
            Analytics
          </p>
          <h2 className="mt-4 font-sans text-4xl font-semibold tracking-tight text-text-primary md:text-5xl">
            Deep insights,
            <br />
            <span className="text-text-secondary">beautifully visualized.</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Spending breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <GlassCard className="h-full">
              <h3 className="text-sm font-medium text-text-primary">Spending Breakdown</h3>
              <p className="mt-1 text-xs text-text-secondary">March 2026</p>

              <div className="mt-6 flex items-center gap-6">
                <div className="relative h-36 w-36 shrink-0">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    {categories.reduce(
                      (acc, cat, i) => {
                        const offset = acc.offset;
                        const dash = cat.percent;
                        acc.elements.push(
                          <circle
                            key={cat.name}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            strokeWidth="12"
                            strokeDasharray={`${dash * 2.51} ${251 - dash * 2.51}`}
                            strokeDashoffset={-offset * 2.51}
                            className={cat.color.replace("bg-", "stroke-")}
                            opacity={0.85}
                          />
                        );
                        acc.offset += dash;
                        return acc;
                      },
                      { offset: 0, elements: [] as React.ReactNode[] }
                    ).elements}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-medium text-text-primary">
                      {formatCurrency(4780)}
                    </span>
                    <span className="text-xs text-text-secondary">Total</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${cat.color}`} />
                        <span className="text-xs text-text-secondary">{cat.name}</span>
                      </div>
                      <span className="text-xs font-medium text-text-primary">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Income vs Expenses */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <GlassCard className="h-full">
              <h3 className="text-sm font-medium text-text-primary">Income vs Expenses</h3>
              <p className="mt-1 text-xs text-text-secondary">Last 6 months</p>

              <div className="mt-8 flex items-end justify-between gap-3 h-40">
                {months.map((month, i) => (
                  <div key={month} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full items-end justify-center gap-1 h-32">
                      <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: `${(incomeData[i] / maxVal) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="w-3 rounded-t bg-brand"
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: `${(expenseData[i] / maxVal) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.1 + 0.05 }}
                        className="w-3 rounded-t bg-cta/70"
                      />
                    </div>
                    <span className="text-[10px] text-text-secondary">{month}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brand" />
                  <span className="text-xs text-text-secondary">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-cta/70" />
                  <span className="text-xs text-text-secondary">Expenses</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Financial Health */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <GlassCard>
              <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">Financial Health Score</h3>
                  <p className="mt-1 text-xs text-text-secondary">
                    Based on savings rate, debt ratio, and spending habits
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  {[
                    { label: "Savings Rate", score: 82 },
                    { label: "Debt Ratio", score: 91 },
                    { label: "Spending", score: 74 },
                    { label: "Overall", score: 83 },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="relative mx-auto h-14 w-14">
                        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${item.score} 100`}
                            className="text-brand"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-text-primary">
                          {item.score}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-text-secondary">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
