import { apiFetch } from "./client";

export interface Goal {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  priority: "high" | "medium" | "low";
  monthly_contribution: number;
  icon: string;
  progress_percentage: number;
  status: string;
  remaining_amount: number;
  months_left: number;
  required_monthly: number;
  delay_months: number;
}

export const GoalsAPI = {
  list: () =>
    apiFetch<{ count: number; results: Goal[] }>("/api/goals/"),

  create: (data: {
    title: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
    priority?: string;
    monthly_contribution?: number;
    icon?: string;
  }) =>
    apiFetch<Goal>("/api/goals/", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: Partial<Goal>) =>
    apiFetch<Goal>(`/api/goals/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiFetch<void>(`/api/goals/${id}/`, { method: "DELETE" }),

  getAIPlan: (refresh = false) =>
    apiFetch<any>(`/api/ai/goal-plan/${refresh ? "?refresh=true" : ""}`),

  simulateIncome: (changePct: number) =>
    apiFetch<any>("/api/ai/goal-plan/simulate/", {
      method: "POST",
      body: JSON.stringify({ change_pct: changePct }),
    }),

  getInvestment: (goalId: number, riskProfile: string, monthlyContribution: number) =>
    apiFetch<any>("/api/ai/goal-investment/", {
      method: "POST",
      body: JSON.stringify({
        goal_id: goalId,
        risk_profile: riskProfile,
        monthly_contribution: monthlyContribution,
      }),
    }),
};
