import { apiFetch, apiUpload, BASE_URL, getTokens } from "./client";

export const AIAPI = {
  // ── Chat ──────────────────────────────────────────────────────────────────
  chat: (question: string, documentId?: number) =>
    apiFetch<{ answer: string; sources: any[]; session_id: number }>("/api/ai/chat/", {
      method: "POST",
      body: JSON.stringify({
        question,
        ...(documentId ? { document_id: documentId } : {}),
      }),
    }),

  getHistory: () => apiFetch<any[]>("/api/ai/chat/history/"),

  getChatSessions: () => apiFetch<any>("/api/ai/chat-sessions/"),

  getChatMessages: (sessionId: number) =>
    apiFetch<any>(`/api/ai/chat-sessions/${sessionId}/messages/`),

  getChatWebSocketUrl: (documentId?: number) => {
    const { access } = getTokens();
    const wsUrl = BASE_URL.replace(/^http/, "ws") + "/ws/ai/chat/";
    const params = new URLSearchParams({ token: access });
    if (documentId) params.set("document_id", String(documentId));
    return `${wsUrl}?${params.toString()}`;
  },

  // ── Documents ──────────────────────────────────────────────────────────────
  processDocument: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiUpload<{
      document_id: number;
      sql_document_id: number;
      mongo_id: string;
      summary: any;
      transactions_created: number;
      rag_chunks_indexed: number;
    }>("/api/ai/document/process/", fd);
  },

  listDocuments: () => apiFetch<any[]>("/api/ai/documents/"),

  getDocumentContent: (id: number) =>
    apiFetch<{ text: string }>(`/api/ai/documents/${id}/content/`),

  getExpenseSummary: (mongoId: string) =>
    apiFetch<any>(`/api/ai/expense-document/${mongoId}/summary/`),

  getSuggestions: (mongoId: string) =>
    apiFetch<any>(`/api/ai/expense-document/${mongoId}/suggestions/`),

  // ── Analysis ──────────────────────────────────────────────────────────────
  getSpendingAnalysis: (refresh = false) =>
    apiFetch<{
      patterns: string[];
      anomalies: string[];
      recommendations: { title: string; description: string; potential_savings: string }[];
    }>(`/api/ai/spending-analysis/${refresh ? "?refresh=true" : ""}`),

  getBudgetAdvice: () =>
    apiFetch<{
      tips: { tip: string; category: string; save_per_month: number }[];
      income: number;
      expense: number;
      savings: number;
    }>("/api/ai/budget-advice/"),

  getDailyBriefing: () => apiFetch<any>("/api/ai/daily-briefing/"),

  getMoneyReplay: (month?: string) =>
    apiFetch<any>(`/api/ai/money-replay/${month ? `?month=${month}` : ""}`),

  getSubscriptionHunter: (lookbackDays?: number) =>
    apiFetch<any>(
      `/api/ai/subscription-hunter/${lookbackDays ? `?lookback_days=${lookbackDays}` : ""}`
    ),

  searchKnowledge: (query: string) =>
    apiFetch<any>(`/api/ai/knowledge/search/?q=${encodeURIComponent(query)}`),

  simulate: (data: any) =>
    apiFetch<any>("/api/ai/simulate/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
