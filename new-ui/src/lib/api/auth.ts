import { apiFetch, saveTokens, clearTokens } from "./client";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  credits?: number;
  ai_credits?: number;
  income?: number;
  onboarding_completed?: boolean;
  financial_health_score?: number;
}

export const AuthAPI = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name?: string;
  }) =>
    apiFetch<{ message: string; user: UserProfile }>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    }, false),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ user: UserProfile; access: string; refresh: string }>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(data),
    }, false),

  me: () => apiFetch<UserProfile>("/auth/me/"),

  updateProfile: (data: { first_name?: string; last_name?: string; income?: number }) =>
    apiFetch<UserProfile>("/auth/profile/update/", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>("/auth/forgot-password/", {
      method: "POST",
      body: JSON.stringify({ email }),
    }, false),

  resetPassword: (data: { token: string; password: string; password_confirm: string }) =>
    apiFetch<{ message: string }>("/auth/reset-password/", {
      method: "POST",
      body: JSON.stringify(data),
    }, false),

  verifyEmail: (token: string) =>
    apiFetch<{ message: string }>("/auth/verify-email/", {
      method: "POST",
      body: JSON.stringify({ token }),
    }, false),

  onboarding: (data: {
    first_name: string;
    last_name?: string;
    monthly_income: number;
    spending: { category: string; amount: number; description?: string }[];
  }) =>
    apiFetch<{ status: string; user: UserProfile }>("/auth/onboarding/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  purchaseCredits: (planId: string) =>
    apiFetch<{ success: boolean; plan: string; credits_added: number; total_credits: number }>(
      "/auth/purchase-credits/",
      { method: "POST", body: JSON.stringify({ plan_id: planId }) }
    ),

  saveTokens,
  clearTokens,
};
