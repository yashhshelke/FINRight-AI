/**
 * @finexa/api — Shared API Service Layer
 * Used by both frontend (React Web) and frontend-mobile (React Native / Expo)
 *
 * Base URL is resolved from environment variable:
 *   Web:    VITE_API_URL
 *   Mobile: EXPO_PUBLIC_API_URL
 *
 * If neither is set, falls back to localhost:8000 for local dev.
 */

// ─── Platform-safe base URL ─────────────────────────────────────────────────
function resolveBaseUrl(): string {
  // Vite (web)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }
  // Expo (mobile) — process.env is injected at bundle time
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'http://localhost:8000';
}

export const BASE_URL = resolveBaseUrl();

// ─── Types ───────────────────────────────────────────────────────────────────
export type SpendingRecommendation = {
  title: string;
  description: string;
  potential_savings: string;
};

export type SpendingAnalysisResponse = {
  patterns: string[];
  anomalies: string[];
  recommendations: SpendingRecommendation[];
};

export type RagChatResponse = {
  answer: string;
  sources: {
    document_name: string;
    preview: string;
    relevance_score: number;
  }[];
};

export type TokenPair = {
  access: string;
  refresh: string;
};

// ─── Internal helpers ────────────────────────────────────────────────────────
function normalizeSpendingRecommendation(entry: any, index: number): SpendingRecommendation {
  if (typeof entry === 'string') {
    return { title: `Recommendation ${index + 1}`, description: entry, potential_savings: '' };
  }
  return {
    title: entry?.title || entry?.category || `Recommendation ${index + 1}`,
    description: entry?.description || entry?.tip || '',
    potential_savings: entry?.potential_savings ||
      (typeof entry?.save_per_month === 'number' ? `₹${entry.save_per_month}/month` : ''),
  };
}

function normalizeSpendingAnalysis(data: any): SpendingAnalysisResponse {
  const fallback: SpendingAnalysisResponse = {
    patterns: ['No recent activity detected.'],
    anomalies: [],
    recommendations: [{
      title: 'Start tracking expenses',
      description: 'Add transactions consistently to unlock richer AI insights.',
      potential_savings: '',
    }],
  };

  if (!data || typeof data !== 'object') return fallback;

  const patterns = Array.isArray(data.patterns)
    ? data.patterns.filter((p: any) => typeof p === 'string' && p.trim())
    : fallback.patterns;

  const anomalies = Array.isArray(data.anomalies)
    ? data.anomalies.filter((a: any) => typeof a === 'string' && a.trim())
    : [];

  const recommendationsRaw = Array.isArray(data.recommendations) ? data.recommendations : [];
  const recommendations = recommendationsRaw
    .map((item: any, idx: number) => normalizeSpendingRecommendation(item, idx))
    .filter((r: SpendingRecommendation) => r.title || r.description);

  return {
    patterns: patterns.length ? patterns : fallback.patterns,
    anomalies,
    recommendations: recommendations.length ? recommendations : fallback.recommendations,
  };
}

// ─── Token storage (web: localStorage | mobile: override via setTokenStorage) ─
let _storage = {
  getItem: (key: string): string | null =>
    typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null,
  setItem: (key: string, value: string): void => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  },
};

/**
 * Override token storage for React Native.
 * Call this at app startup with expo-secure-store or AsyncStorage.
 * @example
 *   import * as SecureStore from 'expo-secure-store';
 *   setTokenStorage({ getItem: SecureStore.getItemAsync, setItem: SecureStore.setItemAsync, removeItem: SecureStore.deleteItemAsync });
 */
export function setTokenStorage(storage: typeof _storage) {
  _storage = storage;
}

function getTokens() {
  return {
    access: _storage.getItem('finexa_access') || '',
    refresh: _storage.getItem('finexa_refresh') || '',
  };
}

function saveTokens(access: string, refresh: string) {
  _storage.setItem('finexa_access', access);
  _storage.setItem('finexa_refresh', refresh);
}

function clearTokens() {
  _storage.removeItem('finexa_access');
  _storage.removeItem('finexa_refresh');
}

// ─── Core fetch wrapper ──────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true,
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (requiresAuth) {
    const { access } = getTokens();
    if (access) headers['Authorization'] = `Bearer ${access}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiFetch<T>(path, options, requiresAuth, false);
    clearTokens();
    const storedUser = _storage.getItem('finexa_user');
    if (!storedUser && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired — please log in again');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || err.detail || JSON.stringify(err));
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const { refresh } = getTokens();
    if (!refresh) return false;
    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    saveTokens(data.access, refresh);
    return true;
  } catch {
    return false;
  }
}

async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const { access } = getTokens();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || err.detail || 'Upload failed');
  }
  return res.json();
}

// ─── Auth API ────────────────────────────────────────────────────────────────
export const AuthAPI = {
  register: (data: {
    username: string; email: string;
    password: string; password_confirm: string;
    first_name?: string; last_name?: string;
  }) => apiFetch<{ message: string; user: any }>('/auth/register/', {
    method: 'POST', body: JSON.stringify(data),
  }, false),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ user: any; access: string; refresh: string }>('/auth/login/', {
      method: 'POST', body: JSON.stringify(data),
    }, false),

  me: () => apiFetch<any>('/auth/me/'),

  updateProfile: (data: { first_name?: string; last_name?: string; income?: number }) =>
    apiFetch<any>('/auth/profile/update/', { method: 'PUT', body: JSON.stringify(data) }),

  forgotPassword: (email: string) =>
    apiFetch<any>('/auth/forgot-password/', { method: 'POST', body: JSON.stringify({ email }) }, false),

  resetPassword: (data: { token: string; password: string }) =>
    apiFetch<any>('/auth/reset-password/', { method: 'POST', body: JSON.stringify(data) }, false),

  verifyEmail: (token: string) =>
    apiFetch<any>('/auth/verify-email/', { method: 'POST', body: JSON.stringify({ token }) }, false),

  logout: () => { clearTokens(); },
  saveTokens,
  getTokens,
  clearTokens,
};

// ─── Wallet API ───────────────────────────────────────────────────────────────
export const WalletAPI = {
  getWallet: () =>
    apiFetch<{ id: number; balance: number; currency: string }>('/api/ai/wallet/'),

  addMoney: (amount: number, description = 'Deposit') =>
    apiFetch<any>('/api/ai/wallet/add-money/', {
      method: 'POST', body: JSON.stringify({ amount, description }),
    }),

  withdraw: (amount: number, description = 'Withdrawal') =>
    apiFetch<any>('/api/ai/wallet/withdraw/', {
      method: 'POST', body: JSON.stringify({ amount, description }),
    }),

  getTransactions: (page = 1) =>
    apiFetch<{ count: number; results: any[] }>(`/api/ai/wallet/transactions/?page=${page}`),

  getTimeline: () => apiFetch<any[]>('/api/ai/wallet/timeline/'),
};

// ─── Card API ─────────────────────────────────────────────────────────────────
export const CardAPI = {
  list: () =>
    apiFetch<{ id: number; last4: string; card_holder: string; expiry: string; card_type: string; gradient_index: number }[]>('/api/users/cards/'),

  add: (data: { card_number: string; card_holder: string; expiry: string; card_type: string; gradient_index: number }) =>
    apiFetch<any>('/api/users/cards/', { method: 'POST', body: JSON.stringify(data) }),

  remove: (id: number) =>
    apiFetch<any>(`/api/users/cards/${id}/`, { method: 'DELETE' }),
};

// ─── Financial Health API ──────────────────────────────────────────────────────
export const HealthAPI = {
  getScore: () =>
    apiFetch<{ score: number; grade: string; trend: string }>('/api/ai/financial-health/score/'),

  getHistory: (period: 'week' | 'month' | 'year' = 'month') =>
    apiFetch<any[]>(`/api/ai/financial-health/history/?period=${period}`),

  getBreakdown: () => apiFetch<any>('/api/ai/financial-health/breakdown/'),

  recalculate: () =>
    apiFetch<any>('/api/ai/financial-health/recalculate/', { method: 'POST' }),

  getRecommendations: () => apiFetch<any[]>('/api/ai/financial-health/recommendations/'),
};

// ─── Transactions API ──────────────────────────────────────────────────────────
export const TransactionsAPI = {
  list: (page = 1, category?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.set('category', category);
    return apiFetch<{ count: number; next: string | null; results: any[] }>(`/api/transactions/?${params}`);
  },

  summary: () => apiFetch<{
    month: string; profile_income: number; transaction_income: number;
    total_income: number; total_expense: number; savings: number;
    all_time_savings: number; categories: { name: string; amount: number }[];
  }>('/api/transactions/summary/'),

  create: (data: { amount: number; category: string; type: 'income' | 'expense'; description: string; date: string }) =>
    apiFetch<any>('/api/transactions/', { method: 'POST', body: JSON.stringify(data) }),

  bulkCreate: (data: Array<{ amount: number; category: string; type: 'income' | 'expense'; description: string; date: string; source?: string; source_document?: string }>) =>
    apiFetch<any>('/api/transactions/bulk/', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Goals API ────────────────────────────────────────────────────────────────
export const GoalsAPI = {
  list: () => apiFetch<{ count: number; results: any[] }>('/api/goals/'),

  create: (data: {
    title: string; target_amount: number; current_amount: number;
    deadline: string; priority?: string; monthly_contribution?: number; icon?: string;
  }) => apiFetch<any>('/api/goals/', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: Partial<any>) =>
    apiFetch<any>(`/api/goals/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: number) =>
    apiFetch<void>(`/api/goals/${id}/`, { method: 'DELETE' }),

  getAIPlan: (refresh = false) =>
    apiFetch<any>(`/api/ai/goal-plan/${refresh ? '?refresh=true' : ''}`),

  simulateIncome: (changePct: number) =>
    apiFetch<any>('/api/ai/goal-plan/simulate/', {
      method: 'POST', body: JSON.stringify({ change_pct: changePct }),
    }),
};

// ─── Gamification API ─────────────────────────────────────────────────────────
export const GamificationAPI = {
  getData: () =>
    apiFetch<{ badges: any[]; total_points: number; level: number }>('/api/gamification/summary/'),

  getChallenges: () =>
    apiFetch<{ count: number; results: any[] }>('/api/gamification/my-challenges/'),

  toggleChallenge: (id: number) =>
    apiFetch<any>(`/api/gamification/my-challenges/${id}/toggle/`, { method: 'POST' }),

  getBadges: () => apiFetch<any[]>('/api/gamification/badges/'),
  getMyBadges: () => apiFetch<any[]>('/api/gamification/my-badges/'),
};

// ─── Settings API ─────────────────────────────────────────────────────────────
export const SettingsAPI = {
  get: () => apiFetch<any>('/api/users/settings/'),

  update: (data: Record<string, any>) =>
    apiFetch<any>('/api/users/settings/', { method: 'PATCH', body: JSON.stringify(data) }),

  getFullProfile: () => apiFetch<any>('/api/users/profile/full/'),

  changePassword: (data: { old_password: string; new_password: string; new_password_confirm: string }) =>
    apiFetch<any>('/api/users/change-password/', { method: 'POST', body: JSON.stringify(data) }),

  exportData: () => apiFetch<any>('/api/users/export-data/', { method: 'POST' }),
};

// ─── AI / RAG API ─────────────────────────────────────────────────────────────
export const AIAPI = {
  // Document processing: upload → extract → embed chunks in Postgres
  processDocument: (file: File | { uri: string; name: string; type: string }) => {
    const fd = new FormData();
    fd.append('file', file as any);
    return apiUpload<{
      success: boolean; document_id: number; mongo_id: string;
      extracted_text: string; structured_data: any; summary: string;
      rag_chunks_indexed: number;
    }>('/api/ai/document/process/', fd);
  },

  listDocuments: () => apiFetch<any[]>('/api/ai/documents/'),

  getDocumentContent: (id: number) =>
    apiFetch<{ text: string }>(`/api/ai/documents/${id}/content/`),

  getExpenseSummary: (mongoId: string) =>
    apiFetch<any>(`/api/ai/expense-document/${mongoId}/summary/`),

  getSuggestions: (mongoId: string) =>
    apiFetch<any>(`/api/ai/expense-document/${mongoId}/suggestions/`),

  // ── RAG Chatbot ──────────────────────────────────────────────────
  chat: (question: string, documentId?: number) =>
    apiFetch<RagChatResponse>('/api/ai/chat/', {
      method: 'POST',
      body: JSON.stringify({ question, ...(documentId ? { document_id: documentId } : {}) }),
    }),

  getHistory: () => apiFetch<any[]>('/api/ai/chat/history/'),

  getChatSessions: () => apiFetch<any>('/api/ai/chat-sessions/'),

  getChatMessages: (sessionId: string) =>
    apiFetch<any>(`/api/ai/chat-sessions/${sessionId}/messages/`),

  // ── Analysis ─────────────────────────────────────────────────────
  getSpendingAnalysis: (refresh = false) =>
    apiFetch<any>(`/api/ai/spending-analysis/${refresh ? '?refresh=true' : ''}`)
      .then(normalizeSpendingAnalysis),

  getBudgetAdvice: () =>
    apiFetch<{ tips: { tip: string; category: string; save_per_month: number }[]; income?: number; expense?: number; savings?: number }>('/api/ai/budget-advice/'),

  simulate: (data: any) =>
    apiFetch<any>('/api/ai/simulate/', { method: 'POST', body: JSON.stringify(data) }),

  creditAnalysis: () => apiFetch<any>('/api/ai/credit-analysis/'),

  getLoanList: () => apiFetch<any>('/api/ai/loans/'),
};

// ─── Notifications API ────────────────────────────────────────────────────────
export const NotificationsAPI = {
  list: () => apiFetch<any[]>('/api/users/notifications/'),

  markRead: (id: number) =>
    apiFetch<any>(`/api/users/notifications/${id}/read/`, { method: 'POST' }),

  markAllRead: () =>
    apiFetch<any>('/api/users/notifications/mark-all-read/', { method: 'POST' }),

  deleteNotif: (id: number) =>
    apiFetch<void>(`/api/users/notifications/${id}/delete/`, { method: 'DELETE' }),
};

// ─── Onboarding API ───────────────────────────────────────────────────────────
export interface OnboardingData {
  first_name: string;
  last_name?: string;
  monthly_income: number;
  spending: { category: string; amount: number; description?: string }[];
}

export const OnboardingAPI = {
  submit: (data: OnboardingData) =>
    apiFetch<any>('/api/users/onboarding/', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Credits API ──────────────────────────────────────────────────────────────
export const CreditsAPI = {
  purchase: (planId: string) =>
    apiFetch<{ success: boolean; plan: string; credits_added: number; total_credits: number }>(
      '/auth/purchase-credits/',
      { method: 'POST', body: JSON.stringify({ plan_id: planId }) },
    ),
};

// ─── Utility ──────────────────────────────────────────────────────────────────
export async function checkBackendAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/me/`, { signal: AbortSignal.timeout(3000) });
    return res.status !== 0;
  } catch {
    return false;
  }
}
