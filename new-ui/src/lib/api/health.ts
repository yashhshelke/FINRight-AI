import { apiFetch } from "./client";

export interface HealthScore {
  score: number;
  category: string;
  color: string;
  month: string;
  calculation_date: string;
  income: number;
  expenses: number;
  expense_ratio: number;
  factors: {
    spending_discipline: number;
    savings_ratio: number;
    credit_utilization: number;
    loan_burden: number;
    risk_exposure: number;
  };
  explanation: string;
  recommendations: string[];
  grade?: string;
  trend?: string;
}

export interface HealthBreakdown {
  overall_score: number;
  category: string;
  color: string;
  month: string;
  factors: {
    name: string;
    display_name: string;
    score: number;
    max_score: number;
    weight: number;
    percentage: number;
    metrics: Record<string, any>;
    explanation: string;
  }[];
}

export const HealthAPI = {
  getScore: () => apiFetch<HealthScore>("/api/ai/financial-health/score/"),

  getHistory: (months = 12) =>
    apiFetch<{ history: any[]; trend: string; change: number; total_months: number }>(
      `/api/ai/financial-health/history/?months=${months}`
    ),

  getBreakdown: () => apiFetch<HealthBreakdown>("/api/ai/financial-health/breakdown/"),

  recalculate: () =>
    apiFetch<any>("/api/ai/financial-health/recalculate/", { method: "POST" }),

  getRecommendations: () =>
    apiFetch<{ score: number; category: string; recommendations: string[] }>(
      "/api/ai/financial-health/recommendations/"
    ),
};
