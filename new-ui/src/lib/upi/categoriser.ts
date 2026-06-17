/**
 * categoriser.ts
 * Client-side UPI transaction categorisation engine.
 * Uses keyword matching against the merchant dictionary.
 * Provides: subscription detection, merchant ranking, savings recommendations.
 * Zero network calls - all logic runs in the browser.
 */

import type { UPITransaction } from "./upiParser";
import { MERCHANT_CATEGORIES } from "./merchant_categories";

export interface CategorisedTransaction extends UPITransaction {
  category: string;
  merchantName: string;
}

export interface MerchantSummary {
  name: string;
  totalSpent: number;
  count: number;
  category: string;
  avgAmount: number;
}

export interface SubscriptionSummary {
  merchantName: string;
  category: string;
  avgAmount: number;
  occurrences: number;
  months: string[];
}

export interface CategorySummary {
  name: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface SavingsRecommendation {
  title: string;
  description: string;
  potentialSavings: string;
  priority: "high" | "medium" | "low";
  icon: string;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#f59e0b",
  "Transport": "#06b6d4",
  "Shopping": "#ec4899",
  "Utilities": "#8b5cf6",
  "Healthcare": "#10b981",
  "Entertainment": "#f97316",
  "Subscriptions": "#ef4444",
  "Education": "#6366f1",
  "Housing & Rent": "#a855f7",
  "Personal Care": "#14b8a6",
  "Finance & Insurance": "#3b82f6",
  "Travel": "#84cc16",
  "Transfers": "#94a3b8",
  "Income": "#22c55e",
  "Other": "#475569",
};

export function categorise(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes("salary") || lower.includes("neft credit") || lower.startsWith("received from") || lower.includes("cashback") || lower.includes("refund") || lower.includes("credit by") || lower.startsWith("receivedfrom")) {
    return "Income";
  }
  if (lower.includes("upi/p2p") || lower.startsWith("sent to") || lower.includes("transfer to") || lower.includes("split") || lower.includes("self transfer") || lower.includes("selftransfer")) {
    return "Transfers";
  }
  for (const [category, keywords] of Object.entries(MERCHANT_CATEGORIES)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  if (lower.startsWith("paid to ") || lower.startsWith("paidto")) {
    const merchant = lower.replace(/^paid\s?to\s*/i, "").trim();
    if (merchant.length < 35 && /^[a-z\s]+$/i.test(merchant)) return "Transfers";
  }
  return "Other";
}

function extractMerchantName(description: string): string {
  return description
    .replace(/^Paid to\s*/i, "")
    .replace(/^Received from\s*/i, "")
    .replace(/^Self transfer\s*(to|from)?\s*/i, "Self Transfer ")
    .replace(/^UPI[/\-]?/i, "")
    .replace(/^NEFT[/\-]?/i, "")
    .replace(/^IMPS[/\-]?/i, "")
    .replace(/^Sent to\s*/i, "")
    .replace(/^Transfer to\s*/i, "")
    .replace(/P2P.*/i, "")
    .split("@")[0]
    .split("/")[0]
    .trim()
    .slice(0, 40);
}

export function processTransactions(txns: UPITransaction[]): CategorisedTransaction[] {
  return txns.map((t) => ({
    ...t,
    category: categorise(t.description),
    merchantName: extractMerchantName(t.description),
  }));
}

export function getCategorySummary(txns: CategorisedTransaction[]): CategorySummary[] {
  const expenses = txns.filter((t) => t.debit > 0 && t.category !== "Income" && t.category !== "Transfers");
  const total = expenses.reduce((s, t) => s + t.debit, 0);
  const map: Record<string, { amount: number; count: number }> = {};
  for (const t of expenses) {
    if (!map[t.category]) map[t.category] = { amount: 0, count: 0 };
    map[t.category].amount += t.debit;
    map[t.category].count += 1;
  }
  return Object.entries(map)
    .map(([name, { amount, count }]) => ({
      name,
      amount: Math.round(amount),
      count,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: CATEGORY_COLORS[name] || "#475569",
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getMonthlyTrend(txns: CategorisedTransaction[]): MonthlyTrend[] {
  const map: Record<string, { income: number; expenses: number }> = {};
  for (const t of txns) {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) continue;
    const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (!map[key]) map[key] = { income: 0, expenses: 0 };
    if (t.credit > 0) map[key].income += t.credit;
    if (t.debit > 0) map[key].expenses += t.debit;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Object.entries(map)
    .map(([month, data]) => ({ month, income: Math.round(data.income), expenses: Math.round(data.expenses), savings: Math.round(data.income - data.expenses) }))
    .sort((a, b) => {
      const [am, ay] = a.month.split(" ");
      const [bm, by] = b.month.split(" ");
      if (ay !== by) return parseInt(ay) - parseInt(by);
      return months.indexOf(am) - months.indexOf(bm);
    });
}

export function getTopMerchants(txns: CategorisedTransaction[], limit = 10): MerchantSummary[] {
  const expenses = txns.filter((t) => t.debit > 0 && t.category !== "Transfers");
  const map: Record<string, { total: number; count: number; category: string }> = {};
  for (const t of expenses) {
    const nm = t.merchantName.toLowerCase();
    if (!map[nm]) map[nm] = { total: 0, count: 0, category: t.category };
    map[nm].total += t.debit;
    map[nm].count += 1;
  }
  return Object.entries(map)
    .map(([name, { total, count, category }]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      totalSpent: Math.round(total),
      count,
      category,
      avgAmount: Math.round(total / count),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

export function detectSubscriptions(txns: CategorisedTransaction[]): SubscriptionSummary[] {
  const expenses = txns.filter((t) => t.debit > 0);
  const merchantMonths: Record<string, { amounts: number[]; months: Set<string>; category: string }> = {};
  for (const t of expenses) {
    const nm = t.merchantName.toLowerCase();
    const d = new Date(t.date);
    if (isNaN(d.getTime())) continue;
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!merchantMonths[nm]) merchantMonths[nm] = { amounts: [], months: new Set(), category: t.category };
    merchantMonths[nm].amounts.push(t.debit);
    merchantMonths[nm].months.add(monthKey);
  }
  const subs: SubscriptionSummary[] = [];
  for (const [name, data] of Object.entries(merchantMonths)) {
    if (data.months.size < 2) continue;
    const avg = data.amounts.reduce((s, a) => s + a, 0) / data.amounts.length;
    const isConsistent = data.amounts.every((a) => Math.abs(a - avg) / avg < 0.15);
    if (!isConsistent) continue;
    const months = Array.from(data.months).sort();
    subs.push({
      merchantName: name.charAt(0).toUpperCase() + name.slice(1),
      category: data.category,
      avgAmount: Math.round(avg),
      occurrences: data.months.size,
      months: months.map((m) => {
        const [y, mo] = m.split("-");
        return new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      }),
    });
  }
  return subs.sort((a, b) => b.avgAmount - a.avgAmount);
}

export function generateRecommendations(
  txns: CategorisedTransaction[],
  categories: CategorySummary[],
  subscriptions: SubscriptionSummary[],
): SavingsRecommendation[] {
  const recs: SavingsRecommendation[] = [];
  const totalIncome = Math.round(txns.filter((t) => t.credit > 0).reduce((s, t) => s + t.credit, 0));

  const food = categories.find((c) => c.name === "Food & Dining");
  if (food && totalIncome > 0 && food.amount / totalIncome > 0.25) {
    const excess = Math.round(food.amount * 0.3);
    recs.push({
      title: "Cut Food Delivery Costs",
      description: `You spent \u20B9${food.amount.toLocaleString("en-IN")} on food & dining \u2014 ${food.percentage.toFixed(0)}% of expenses. Cooking at home 3\u20134 days a week could save you significantly.`,
      potentialSavings: `\u20B9${excess.toLocaleString("en-IN")}/month`,
      priority: "high",
      icon: "\uD83C\uDF7D\uFE0F",
    });
  }

  const subTotal = subscriptions.reduce((s, sub) => s + sub.avgAmount, 0);
  if (subscriptions.length >= 3) {
    recs.push({
      title: "Review Your Subscriptions",
      description: `You have ${subscriptions.length} recurring subscriptions costing \u20B9${subTotal.toLocaleString("en-IN")}/month. Cancel 2\u20133 unused ones.`,
      potentialSavings: `\u20B9${Math.round(subTotal * 0.4).toLocaleString("en-IN")}/month`,
      priority: "high",
      icon: "\uD83D\uDCF1",
    });
  }

  const transport = categories.find((c) => c.name === "Transport");
  if (transport && transport.amount > 2000) {
    recs.push({
      title: "Optimise Travel Costs",
      description: `Transport spend is \u20B9${transport.amount.toLocaleString("en-IN")}. Consider metro passes or carpooling for short distances.`,
      potentialSavings: `\u20B9${Math.round(transport.amount * 0.25).toLocaleString("en-IN")}/month`,
      priority: "medium",
      icon: "\uD83D\uDE97",
    });
  }

  const entertainment = categories.find((c) => c.name === "Entertainment");
  if (entertainment && totalIncome > 0 && entertainment.amount / totalIncome > 0.1) {
    recs.push({
      title: "Set an Entertainment Budget",
      description: `Entertainment accounts for ${entertainment.percentage.toFixed(0)}% of spending. Setting a monthly cap can help.`,
      potentialSavings: `\u20B9${Math.round(entertainment.amount * 0.35).toLocaleString("en-IN")}/month`,
      priority: "medium",
      icon: "\uD83C\uDFAC",
    });
  }

  const expensesTotal = categories.reduce((s, c) => s + c.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - expensesTotal) / totalIncome) * 100 : 0;
  if (savingsRate < 20 && totalIncome > 0) {
    recs.push({
      title: "Boost Your Savings Rate to 20%",
      description: `Current savings rate is ~${savingsRate.toFixed(0)}%. Set up auto-transfer to a savings account on payday.`,
      potentialSavings: `Target \u20B9${Math.round(totalIncome * 0.2).toLocaleString("en-IN")}/month`,
      priority: "medium",
      icon: "\uD83D\uDCB0",
    });
  }

  return recs;
}
