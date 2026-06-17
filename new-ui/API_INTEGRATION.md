# new-ui API Integration Guide

## Architecture

```
new-ui/src/lib/api/
├── client.ts         ← Core fetch wrapper, token management
├── auth.ts           ← AuthAPI
├── transactions.ts   ← TransactionsAPI
├── goals.ts          ← GoalsAPI
├── health.ts         ← HealthAPI
├── ai.ts             ← AIAPI
├── gamification.ts   ← GamificationAPI
├── settings.ts       ← SettingsAPI, NotificationsAPI, CardsAPI
└── index.ts          ← Barrel export
```

---

## Using the API Client

```typescript
import { TransactionsAPI } from "@/lib/api/transactions";
import { useQuery } from "@tanstack/react-query";

// In a component
const { data, isLoading } = useQuery({
  queryKey: ["tx-summary"],
  queryFn: () => TransactionsAPI.summary(),
  staleTime: 5 * 60 * 1000, // 5 min cache
});
```

---

## Auth Context

```typescript
import { useAuth } from "@/lib/auth-context";

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth();

  // user.email, user.first_name, user.ai_credits, etc.
}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Django backend base URL |
| `LOVABLE_API_KEY` | — | Required only for `/api/chat` Lovable AI route |

---

## Token Storage

Tokens are stored in `localStorage`:
- `finexa_access` — JWT access token
- `finexa_refresh` — JWT refresh token
- `finexa_user` — Cached user profile object

Auto-refresh: When a 401 is received, the client automatically tries `POST /auth/refresh/`.
If refresh fails, tokens are cleared and user is redirected to `/auth/login`.

---

## WebSocket Chat

The AI Coach uses WebSocket streaming for real-time responses:

```typescript
import { AIAPI } from "@/lib/api/ai";

const wsUrl = AIAPI.getChatWebSocketUrl(documentId?: number);
const ws = new WebSocket(wsUrl);
// Token is passed as query param: ws://localhost:8000/ws/ai/chat/?token=<jwt>

ws.onopen = () => ws.send(JSON.stringify({ question: "..." }));
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === "token") { /* append to message */ }
  if (data.type === "done") { /* finalize */ }
};
```

HTTP fallback is used automatically if WebSocket fails.

---

## React Query Keys

| Key | Endpoint |
|---|---|
| `["tx-summary"]` | `GET /api/transactions/summary/` |
| `["transactions", page, category]` | `GET /api/transactions/` |
| `["health-score"]` | `GET /api/ai/financial-health/score/` |
| `["health-breakdown"]` | `GET /api/ai/financial-health/breakdown/` |
| `["health-recs"]` | `GET /api/ai/financial-health/recommendations/` |
| `["health-history"]` | `GET /api/ai/financial-health/history/` |
| `["goals"]` | `GET /api/goals/` |
| `["goal-ai-plan"]` | `GET /api/ai/goal-plan/` |
| `["chat-history"]` | `GET /api/ai/chat/history/` |
| `["spending-analysis", key]` | `GET /api/ai/spending-analysis/` |
| `["documents"]` | `GET /api/ai/documents/` |
| `["gamification-summary"]` | `GET /api/gamification/summary/` |
| `["my-challenges"]` | `GET /api/gamification/my-challenges/` |
| `["profile-full"]` | `GET /api/users/profile/full/` |
| `["cards"]` | `GET /api/users/cards/` |
| `["subscription-hunter"]` | `GET /api/ai/subscription-hunter/` |
| `["daily-briefing"]` | `GET /api/ai/daily-briefing/` |

---

## Adding a New API Call

1. Add method to the relevant file in `src/lib/api/`
2. Use `apiFetch<ReturnType>(path, options)` from `client.ts`
3. Use `useQuery` or `useMutation` in the component
4. Add a query key to the table above

Example:
```typescript
// In goals.ts
export const GoalsAPI = {
  // existing...
  getInvestment: (goalId: number, riskProfile: string, monthly: number) =>
    apiFetch<any>("/api/ai/goal-investment/", {
      method: "POST",
      body: JSON.stringify({ goal_id: goalId, risk_profile: riskProfile, monthly_contribution: monthly }),
    }),
};
```

```typescript
// In component
const { mutate, isPending } = useMutation({
  mutationFn: () => GoalsAPI.getInvestment(goal.id, "Moderate", 5000),
  onSuccess: (data) => setInvestmentPlan(data),
});
```
