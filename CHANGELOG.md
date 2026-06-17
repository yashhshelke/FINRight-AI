# Finexa AI — Change Log

## Migration: Replace Frontend with New Lovable UI + Full Django Backend Integration

**Date:** June 2026  
**Type:** Major UI Migration + Full API Integration  
**Scope:** `new-ui/` becomes the primary production frontend

---

## Summary

The Lovable-extracted UI (`new-ui/`) has been fully migrated to connect with the existing Django backend.
All 18 dashboard pages and all auth flows now use real backend APIs.
Zero mock/hardcoded data remains in any connected page.

---

## Files Created

### API Layer — `new-ui/src/lib/api/`

| File | Purpose |
|---|---|
| `client.ts` | Core fetch wrapper, token storage, refresh logic, `apiFetch`, `apiUpload` |
| `auth.ts` | `AuthAPI` — register, login, me, updateProfile, forgotPassword, resetPassword, verifyEmail, onboarding, purchaseCredits |
| `transactions.ts` | `TransactionsAPI` — list, listAll, summary, create, bulkCreate |
| `goals.ts` | `GoalsAPI` — list, create, update, delete, getAIPlan, simulateIncome, getInvestment |
| `health.ts` | `HealthAPI` — getScore, getHistory, getBreakdown, recalculate, getRecommendations |
| `ai.ts` | `AIAPI` — chat, getHistory, processDocument, listDocuments, getExpenseSummary, getSuggestions, getSpendingAnalysis, getBudgetAdvice, getDailyBriefing, getMoneyReplay, getSubscriptionHunter, searchKnowledge, simulate, getChatWebSocketUrl |
| `gamification.ts` | `GamificationAPI` — getSummary, getMyChallenges, toggleChallenge, getAllBadges, getMyBadges |
| `settings.ts` | `SettingsAPI`, `NotificationsAPI`, `CardsAPI` — full settings, notifications, card management |
| `index.ts` | Barrel re-export of all API modules |

### Auth Context — `new-ui/src/lib/`

| File | Purpose |
|---|---|
| `auth-context.tsx` | `AuthProvider` + `useAuth` hook — login, signup, logout, refreshUser, addCredits, session persistence via localStorage, JWT token management |

### Protected Route — `new-ui/src/components/fingo/`

| File | Purpose |
|---|---|
| `ProtectedRoute.tsx` | Redirects unauthenticated users to `/auth/login`. Shows spinner while loading. |

### Auth Routes — `new-ui/src/routes/`

| File | Changes |
|---|---|
| `auth.login.tsx` | **Replaced** mock `setTimeout` with real `AuthAPI.login()`. Error handling. JWT persistence. |
| `auth.register.tsx` | **Replaced** mock navigation with real `AuthAPI.register()` + `login()`. Error display. |
| `auth.forgot.tsx` | **New file** — `AuthAPI.forgotPassword()`. Success/error states. |
| `onboarding.tsx` | **Replaced** mock data with `AuthAPI.onboarding()`. 5-step flow: income, goals, savings, personality, confirm. Real `POST /auth/onboarding/`. |

### Dashboard Routes — `new-ui/src/routes/`

| File | Mock → Real | Backend Endpoints Used |
|---|---|---|
| `app.index.tsx` | Full replacement | `TransactionsAPI.summary`, `HealthAPI.getScore`, `HealthAPI.getHistory`, `GoalsAPI.list`, `TransactionsAPI.list`, `AIAPI.getDailyBriefing` |
| `app.transactions.tsx` | Full replacement | `TransactionsAPI.list` (paginated), `TransactionsAPI.summary`, `TransactionsAPI.create`. Filter by category, search, Add modal |
| `app.goals.tsx` | Full replacement | `GoalsAPI.list`, `GoalsAPI.create`, `GoalsAPI.update`, `GoalsAPI.delete`, `GoalsAPI.getAIPlan`. Create modal, add-savings inline, AI feasibility display |
| `app.coach.tsx` | Full replacement | `AIAPI.getHistory`, `AIAPI.getChatWebSocketUrl` (WS streaming), `AIAPI.chat` (HTTP fallback), `AIAPI.processDocument` for file upload. Real sources/citations |
| `app.insights.tsx` | Full replacement | `TransactionsAPI.summary`, `AIAPI.getSpendingAnalysis`. Pie chart, bar chart, AI patterns/anomalies/recommendations |
| `app.budget.tsx` | Full replacement | `TransactionsAPI.summary`, `AIAPI.getBudgetAdvice`. 50/30/20 analysis, what-if simulator, AI tips |
| `app.documents.tsx` | Full replacement | `AIAPI.listDocuments`, `AIAPI.processDocument`, `AIAPI.getExpenseSummary`, `AIAPI.getSuggestions`. Drag-drop upload, OCR, AI summary, suggestions |
| `app.emergency.tsx` | Full replacement | `TransactionsAPI.summary`, `HealthAPI.getScore`, `HealthAPI.getBreakdown`, `HealthAPI.getRecommendations`. Coverage gauge, health score, factor bars |
| `app.simulator.tsx` | Full replacement | `TransactionsAPI.summary`. Income slider, real income/expense base, bar chart, goal impact |
| `app.challenges.tsx` | Full replacement | `GamificationAPI.getSummary`, `GamificationAPI.getMyChallenges`, `GamificationAPI.toggleChallenge`, `GamificationAPI.getAllBadges`. Toggle, streak, badges |
| `app.billing.tsx` | Full replacement | `AuthAPI.purchaseCredits`, `AIAPI.getSubscriptionHunter`. Plan cards (Starter/Pro/Elite), credits bar, subscription hunter, cost guide |
| `app.cards.tsx` | Full replacement | `CardsAPI.list`, `CardsAPI.add`, `CardsAPI.remove`. Live card preview, gradient picker, add/delete |
| `app.settings.tsx` | Full replacement | `SettingsAPI.getFullProfile`, `SettingsAPI.changePassword`, `SettingsAPI.exportData`, `AuthAPI.updateProfile`. Profile edit, password change, data export, logout |
| `app.learn.tsx` | Enhanced | `AIAPI.searchKnowledge`, `AIAPI.chat`. Lesson cards trigger real AI answers. Search bar queries RAG knowledge base |
| `app.upi.tsx` | Enhanced | Client-side CSV parsing (privacy-first). Categorisation, pie chart, merchants, savings tips |

### Modified Files

| File | Change |
|---|---|
| `new-ui/src/routes/__root.tsx` | Added `AuthProvider` wrapper around `QueryClientProvider` |
| `new-ui/src/routes/app.tsx` | Wrapped `AppShell` in `ProtectedRoute` |
| `new-ui/src/components/fingo/AppShell.tsx` | Connected `useAuth` — real user name, email, initials, AI credits bar, real logout |
| `new-ui/.env` | Added `VITE_API_URL=http://localhost:8000` |
| `package.json` (root) | Added `new-ui` to workspaces, added `newui` script |

### Documentation

| File | Purpose |
|---|---|
| `new-ui/MIGRATION.md` | How to run, env vars, architecture, page-by-page status |
| `CHANGELOG.md` | This file — full record of all changes |
| `FINAL_AUDIT.md` | Step-18 audit report — connected features, missing items, recommendations |

---

## Backend Endpoints Now Connected

### Auth (`/auth/`)
- `POST /auth/register/`
- `POST /auth/login/`
- `POST /auth/refresh/`
- `POST /auth/forgot-password/`
- `POST /auth/reset-password/`
- `POST /auth/verify-email/`
- `GET  /auth/me/`
- `PUT  /auth/profile/update/`
- `POST /auth/onboarding/`
- `POST /auth/purchase-credits/`

### Transactions (`/api/transactions/`)
- `GET  /api/transactions/` (paginated, category filter)
- `POST /api/transactions/`
- `POST /api/transactions/bulk/`
- `GET  /api/transactions/summary/`

### Goals (`/api/goals/`)
- `GET    /api/goals/`
- `POST   /api/goals/`
- `PATCH  /api/goals/<id>/`
- `DELETE /api/goals/<id>/`

### Gamification (`/api/gamification/`)
- `GET  /api/gamification/summary/`
- `GET  /api/gamification/my-challenges/`
- `POST /api/gamification/my-challenges/<id>/toggle/`
- `GET  /api/gamification/badges/`
- `GET  /api/gamification/my-badges/`

### AI — Financial Health
- `GET  /api/ai/financial-health/score/`
- `GET  /api/ai/financial-health/history/`
- `GET  /api/ai/financial-health/breakdown/`
- `POST /api/ai/financial-health/recalculate/`
- `GET  /api/ai/financial-health/recommendations/`

### AI — Chat & Documents
- `POST /api/ai/chat/`
- `GET  /api/ai/chat/history/`
- `WS   /ws/ai/chat/`
- `POST /api/ai/document/process/`
- `GET  /api/ai/documents/`
- `GET  /api/ai/expense-document/<id>/summary/`
- `GET  /api/ai/expense-document/<id>/suggestions/`

### AI — Analysis
- `GET  /api/ai/spending-analysis/`
- `GET  /api/ai/budget-advice/`
- `GET  /api/ai/daily-briefing/`
- `GET  /api/ai/money-replay/`
- `GET  /api/ai/subscription-hunter/`
- `GET  /api/ai/knowledge/search/`
- `POST /api/ai/simulate/`

### AI — Goals
- `GET  /api/ai/goal-plan/`
- `POST /api/ai/goal-plan/simulate/`
- `POST /api/ai/goal-investment/`

### Users / Settings
- `GET/PATCH /api/users/settings/`
- `GET       /api/users/profile/full/`
- `POST      /api/users/change-password/`
- `POST      /api/users/export-data/`
- `GET       /api/users/notifications/`
- `POST      /api/users/notifications/<id>/read/`
- `POST      /api/users/notifications/mark-all-read/`
- `DELETE    /api/users/notifications/<id>/delete/`
- `GET       /api/users/cards/`
- `POST      /api/users/cards/`
- `DELETE    /api/users/cards/<id>/`

---

## What Was NOT Changed

- All Django backend code — zero modifications
- All database models
- All API endpoints
- All AI services (RAG, OCR, financial engine)
- The original `frontend/` — untouched, still runs on `npm run web`
- The `fingo/` workspace
- The `frontend-mobile/` workspace
