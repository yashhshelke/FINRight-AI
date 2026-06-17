/**
 * calculations.ts
 * Pure financial calculation functions used across the app.
 * No network calls - all logic runs client-side.
 */

export function calculateHealthScore(params: {
  incomeStability: number;
  expenseRatio: number;
  savingsRatio: number;
  debtToIncome: number;
  emergencyMonths: number;
}): number {
  const { incomeStability, expenseRatio, savingsRatio, debtToIncome, emergencyMonths } = params;
  const incomePts = incomeStability * 2;
  const expensePts = expenseRatio <= 0.5 ? 25 : expenseRatio <= 0.7 ? 20 : expenseRatio <= 0.85 ? 12 : 5;
  const savingsPts = savingsRatio >= 0.3 ? 25 : savingsRatio >= 0.2 ? 20 : savingsRatio >= 0.1 ? 13 : 5;
  const debtPts = debtToIncome <= 0.1 ? 15 : debtToIncome <= 0.2 ? 12 : debtToIncome <= 0.36 ? 8 : 3;
  const emergencyPts = emergencyMonths >= 6 ? 15 : emergencyMonths >= 3 ? 10 : emergencyMonths >= 1 ? 6 : 2;
  return Math.round(incomePts + expensePts + savingsPts + debtPts + emergencyPts);
}

export function calculateStressScore(params: {
  debtBurden: number;
  incomeInstability: number;
  savingsInconsistency: number;
  expenseGrowth: number;
}): number {
  const { debtBurden, incomeInstability, savingsInconsistency, expenseGrowth } = params;
  const raw = ((debtBurden + incomeInstability + savingsInconsistency) / 3) * 10 + Math.min(expenseGrowth * 2, 10);
  return Math.min(100, Math.round(raw));
}

export function getStressLevel(score: number): { label: string; color: string; bg: string } {
  if (score <= 35) return { label: "Low Stress", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
  if (score <= 65) return { label: "Moderate Stress", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  return { label: "High Stress", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
}

export function getHealthLabel(score: number): { label: string; color: string } {
  if (score >= 76) return { label: "Excellent", color: "#22c55e" };
  if (score >= 56) return { label: "Good", color: "#eab308" };
  if (score >= 36) return { label: "Fair", color: "#f97316" };
  return { label: "Poor", color: "#ef4444" };
}

export function calculateEmergencyBuffer(monthlyExpenses: number, currentSavings: number) {
  const monthsCovered = monthlyExpenses > 0 ? currentSavings / monthlyExpenses : 0;
  const idealBuffer3m = monthlyExpenses * 3;
  const idealBuffer6m = monthlyExpenses * 6;
  const gapTo3m = Math.max(0, idealBuffer3m - currentSavings);
  const gapTo6m = Math.max(0, idealBuffer6m - currentSavings);
  return {
    monthsCovered: +monthsCovered.toFixed(1),
    idealBuffer3m,
    idealBuffer6m,
    gapTo3m,
    gapTo6m,
    isSafe: monthsCovered >= 3,
    isIdeal: monthsCovered >= 6,
    suggestedMonthlyAdd: gapTo3m > 0 ? Math.ceil(gapTo3m / 6) : 0,
  };
}

export function calculateGoalFeasibility(
  targetAmount: number,
  currentAmount: number,
  monthlyContribution: number,
  deadlineStr: string,
) {
  const remaining = targetAmount - currentAmount;
  const monthsLeft = Math.max(1, Math.ceil((new Date(deadlineStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
  const requiredMonthly = remaining / monthsLeft;
  const feasibility = monthlyContribution > 0 ? Math.min(100, Math.round((monthlyContribution / requiredMonthly) * 100)) : 0;
  const progressPct = Math.round((currentAmount / targetAmount) * 100);
  const monthsToComplete = monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : Infinity;
  const delayMonths = Math.max(0, (isFinite(monthsToComplete) ? monthsToComplete : monthsLeft * 2) - monthsLeft);
  return { feasibility, progressPct, requiredMonthly: Math.round(requiredMonthly), monthsLeft, monthsToComplete, delayMonths, onTrack: feasibility >= 80 };
}

export function simulateIncomeDropScenario(
  currentIncome: number,
  monthlyExpenses: number,
  savings: number,
  dropPercent: number,
) {
  const newIncome = currentIncome * (1 - dropPercent / 100);
  const monthlyShortfall = Math.max(0, monthlyExpenses - newIncome);
  const survivalMonths = monthlyShortfall > 0 ? +(savings / monthlyShortfall).toFixed(1) : Infinity;
  const essentialExpenses = monthlyExpenses * 0.6;
  const cuttableExpenses = monthlyExpenses * 0.4;
  const newSavingsRate = newIncome > monthlyExpenses ? ((newIncome - monthlyExpenses) / newIncome) * 100 : 0;
  return {
    newIncome: Math.round(newIncome),
    monthlyShortfall,
    survivalMonths: isFinite(survivalMonths) ? survivalMonths : 99,
    requiredCuts: monthlyShortfall > 0 ? Math.ceil(monthlyShortfall) : 0,
    essentialExpenses: Math.round(essentialExpenses),
    cuttableExpenses: Math.round(cuttableExpenses),
    newSavingsRate: +newSavingsRate.toFixed(1),
    isCritical: (isFinite(survivalMonths) ? survivalMonths : 99) < 3,
  };
}

export function detectSpendingPersonality(expenses: { name: string; amount: number; budget: number }[]): {
  type: string;
  description: string;
  color: string;
  icon: string;
} {
  if (expenses.length === 0) {
    return { type: "New User", description: "Add transactions to discover your spending personality.", color: "#6b7280", icon: "\u2728" };
  }
  const overBudgetCount = expenses.filter((e) => e.amount > e.budget).length;
  const totalBudget = expenses.reduce((s, e) => s + e.budget, 0);
  const totalActual = expenses.reduce((s, e) => s + e.amount, 0);
  const overspendRatio = totalBudget > 0 ? totalActual / totalBudget : 1;

  if (overBudgetCount >= 3 && overspendRatio > 1.2) {
    return { type: "Impulse Spender", description: "You often exceed budgets on non-essentials. Small wins: pause before purchases.", color: "#ef4444", icon: "\u26A1" };
  }
  if (overspendRatio <= 0.85) {
    return { type: "Conservative Saver", description: "You consistently spend well under budget. Keep building that savings buffer!", color: "#10b981", icon: "\uD83D\uDEE1\uFE0F" };
  }
  if (overBudgetCount <= 1 && overspendRatio <= 1.05) {
    return { type: "Balanced Planner", description: "You have great spending discipline with minor deviations. Almost perfect!", color: "#a855f7", icon: "\u2696\uFE0F" };
  }
  return { type: "Lifestyle Spender", description: "You prioritize experiences and comfort. Focus on needs vs. wants distinction.", color: "#f59e0b", icon: "\u2728" };
}

export function formatCurrency(amount: number, currency = "\u20B9"): string {
  if (amount >= 100000) return `${currency}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(1)}k`;
  return `${currency}${amount.toLocaleString("en-IN")}`;
}

export function formatFullCurrency(amount: number, currency = "\u20B9"): string {
  return `${currency}${amount.toLocaleString("en-IN")}`;
}
