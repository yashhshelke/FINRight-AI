import { apiFetch } from "./client";

export const GamificationAPI = {
  getSummary: () =>
    apiFetch<{
      challenges: { completed: number; total: number; max_streak: number };
      badges: { earned: any[]; all: any[] };
    }>("/api/gamification/summary/"),

  getMyChallenges: () =>
    apiFetch<{ count: number; results: any[] }>("/api/gamification/my-challenges/"),

  toggleChallenge: (id: number) =>
    apiFetch<any>(`/api/gamification/my-challenges/${id}/toggle/`, {
      method: "POST",
    }),

  getAllBadges: () => apiFetch<any[]>("/api/gamification/badges/"),
  getMyBadges: () => apiFetch<any[]>("/api/gamification/my-badges/"),
};
