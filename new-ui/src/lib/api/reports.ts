import { apiFetch } from "./client";

export interface FinancialReport {
  id: number;
  title: string;
  report_type: string;
  data: any;
  created_at: string;
}

export const ReportsAPI = {
  list: () => apiFetch<FinancialReport[]>("/api/reports/"),

  generate: () =>
    apiFetch<FinancialReport>("/api/reports/", { method: "POST" }),
};
