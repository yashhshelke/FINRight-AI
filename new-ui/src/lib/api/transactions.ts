import { apiFetch } from "./client";

export interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: string;
  category: string;
  description: string;
  date: string;
  source?: string;
  source_document?: string;
}

export interface TransactionSummary {
  month: string;
  profile_income: number;
  transaction_income: number;
  total_income: number;
  total_expense: number;
  savings: number;
  all_time_savings: number;
  categories: { name: string; amount: number }[];
}

export const TransactionsAPI = {
  list: (page = 1, category?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.set("category", category);
    return apiFetch<{ count: number; next: string | null; previous: string | null; results: Transaction[] }>(
      `/api/transactions/?${params}`
    );
  },

  listAll: async (): Promise<Transaction[]> => {
    let all: Transaction[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const d = await TransactionsAPI.list(page);
      all = [...all, ...(d.results || [])];
      hasMore = !!d.next;
      page++;
    }
    return all;
  },

  summary: () =>
    apiFetch<TransactionSummary>("/api/transactions/summary/"),

  create: (data: {
    amount: number;
    category: string;
    type: "income" | "expense";
    description: string;
    date: string;
  }) =>
    apiFetch<Transaction>("/api/transactions/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  bulkCreate: (
    data: Array<{
      amount: number;
      category: string;
      type: "income" | "expense";
      description: string;
      date: string;
      source?: string;
      source_document?: string;
    }>
  ) =>
    apiFetch<{ message: string }>("/api/transactions/bulk/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
