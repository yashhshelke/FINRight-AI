"use client";

import { motion } from "framer-motion";
import { Sparkles, Send } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";

const conversations = [
  {
    role: "user" as const,
    message: "How can I save more this month?",
  },
  {
    role: "assistant" as const,
    message:
      "Based on your spending patterns, you could save an additional $340 by reducing dining out from 8 to 5 times per month. Your grocery spending is already 12% below average — great work there.",
  },
  {
    role: "user" as const,
    message: "Can I reach my laptop goal by December?",
  },
  {
    role: "assistant" as const,
    message:
      "At your current savings rate of $280/month toward the laptop fund, you'll reach your $2,400 goal by mid-November. If you redirect the dining savings I mentioned, you could get there by early October.",
  },
];

const suggestions = [
  "Analyze my spending habits",
  "What's my biggest expense category?",
  "How's my emergency fund looking?",
];

export function AIAssistantPreview() {
  return (
    <section id="ai-guide" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="text-sm font-medium tracking-widest text-brand-light uppercase">
            AI Financial Guide
          </p>
          <h2 className="mt-4 font-sans text-4xl font-semibold tracking-tight text-text-primary md:text-5xl">
            Advice that feels
            <br />
            <span className="text-text-secondary">like a financial advisor.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-2xl"
        >
          <GlassCard glow className="overflow-hidden p-0">
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-white/8 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20">
                <Sparkles size={16} className="text-brand-light" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Fingo AI</p>
                <p className="text-xs text-text-secondary">Your financial guide</p>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4 px-6 py-6 max-h-[400px] overflow-y-auto">
              {conversations.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-brand/20 text-text-primary"
                        : "bg-white/5 text-text-secondary"
                    }`}
                  >
                    {msg.message}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 px-6 pb-4">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-white/8 px-6 py-4">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <input
                  type="text"
                  placeholder="Ask about your finances..."
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/50 outline-none"
                  readOnly
                />
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
