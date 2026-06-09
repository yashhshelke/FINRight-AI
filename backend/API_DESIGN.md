# Finexa AI — Backend API Design

This document summarizes all REST API endpoints implemented in the `backend/` Django project.
It lists paths, HTTP methods, authentication requirements, short request/response notes, and important behavior (credit costs, side-effects).

## Base routing
- Main includes shown in [core/urls.py](core/urls.py):
  - `/auth/` -> includes `users.urls` (authentication & profile)
  - `/api/ai/` -> includes `ai_assistant.urls` (AI features, documents, chat, financial health)
  - `/api/users/` -> includes `users.urls` (user profile & settings)
  - `/api/transactions/` -> includes `transactions.urls`
  - `/api/goals/` -> includes `savings_goals.urls`
  - `/api/gamification/` -> includes `gamification.urls`
  - `/api/reports/` -> includes `reports.urls`

Note: `users.urls` is mounted twice: under `/auth/` and `/api/users/` (both expose the same endpoints).

---

## Authentication
- JWT-based with access + refresh tokens.
- Endpoints that create/refresh tokens are public (`AllowAny`).
- Most endpoints require `Authorization: Bearer <access_token>` (views use `IsAuthenticated`).

---

## Endpoints (by app)

**Users (`users.urls`) — mounted at `/auth/` and `/api/users/`**
- POST `/register/` — Register new user. (AllowAny)
  - Body: `full_name, email, password, password_confirm`
  - Optional body fields: `age, occupation, monthly_income, financial_goals, city`
  - Response: 201 with `user` object

- POST `/login/` — Login and receive `access` and `refresh` tokens. (AllowAny)
  - Body: `email, password`
  - Response: 200 `{ access, refresh, user }`

- POST `/refresh/` — Exchange refresh token for new access token. (AllowAny)
  - Body: `{ "refresh": "<token>" }`
  - Response: `{ access: "..." }`

- POST `/verify-email/` — Verify user email with token. (AllowAny)
- POST `/send-verification-email/` — Resend verification email. (AllowAny)

- POST `/forgot-password/` — Send password reset email. (AllowAny)
- POST `/reset-password/` — Reset password with token. (AllowAny)

- GET `/me/` — Get current user profile. (Auth required)
- PUT `/profile/update/` — Update basic profile (first/last name, income). (Auth required)
- GET `/profile/full/` — Full profile + settings + financial summary. (Auth required)

- POST `/onboarding/` — Submit onboarding data (income, initial spending). (Auth required)
- POST `/purchase-credits/` — Purchase AI credits (adds to user's credits). (Auth required)

- GET `/notifications/` — List notifications. (Auth required)
- POST `/notifications/<id>/read/` — Mark single notification read. (Auth required)
- POST `/notifications/mark-all-read/` — Mark all as read. (Auth required)
- DELETE `/notifications/<id>/delete/` — Delete notification. (Auth required)

- GET/PUT/PATCH `/settings/` — Get/update user settings. (Auth required)
- POST `/change-password/` — Change password for authenticated user. (Auth required)

- POST `/export-data/` — Export user data as JSON (transactions, notifications, settings). (Auth required)

Notes: registration/login endpoints return well-formed JSON and use DRF generic views.

---

**AI Assistant (`/api/ai/`)**
- POST `/api/ai/document/process/` — Upload document, extract text, run LLM extraction, save structured JSON to Mongo, create transactions.
  - Auth required. `parser_classes` accept multipart file upload.
  - Credits: deducts 5 credits (refunded on dedup/no-file).
  - Response: summary, `document_id`, `mongo_id`, `transactions_created`, `rag_chunks_indexed`.

- GET `/api/ai/documents/` — List uploaded SQL documents for user. (Auth required)
- GET `/api/ai/documents/<document_id>/content/` — Return raw extracted text + metadata. (Auth required)

- GET `/api/ai/expense-document/<mongo_id>/summary/` — Summary computed from Mongo expense doc. (Auth required)
- GET `/api/ai/expense-document/<mongo_id>/suggestions/` — Actionable suggestions from expense doc. (Auth required)

- POST `/api/ai/chat/` — RAG chat endpoint.
  - Body: `{ question, document_id?, mongo_id?, session_id? }`
  - Auth required.
  - Response: `{ answer, sources, session_id }`

- POST `/api/ai/intelligence/` — Structured assistant endpoint.
  - Body: `{ question, month?, amount?, purchase_amount?, horizon_months? }`
  - Auth required.
  - Response: structured JSON with `insight`, `recommendation`, `risk_level`, `source`, `confidence`, `tool`, and `data`.

- POST `/api/ai/tools/` — Direct backend financial tool router.
  - Body: `{ tool, month?, amount?, purchase_amount?, horizon_months? }`
  - Auth required.
  - Response: structured JSON backed by deterministic backend calculations.

- POST `/api/ai/goal-investment/` — Goal-to-investment planner.
  - Body: `{ goal_amount, years, current_amount?, expected_return_pct?, title? }` or `{ goals: [...] }`
  - Auth required.
  - Response: SIP estimate plus a goal roadmap with affordability analysis and call-to-action text.

- GET `/api/ai/subscription-hunter/` — Subscription detection and cancellation suggestions.
  - Query params: `lookback_days?`
  - Auth required.
  - Response: recurring subscriptions, inactivity days, and recoverable savings.

- GET `/api/ai/money-replay/` — Month-end shareable story slides.
  - Query params: `month?`
  - Auth required.
  - Response: slide deck data with monthly income, savings, biggest purchase, best and worst decisions, and share caption.

- GET `/api/ai/knowledge/search/` — Verified educational knowledge search.
  - Query params: `q` or `query`
  - Auth required.
  - Response: internal knowledge articles with verified citations.

- Celery background jobs are available for nightly digests and report generation when broker settings are configured.

- GET `/api/ai/chat/history/` — Global chat history for the user. (Auth required)
- GET `/api/ai/chat-sessions/` — List chat sessions. (Auth required)
- GET `/api/ai/chat-sessions/<session_id>/messages/` — Messages in a session. (Auth required)

- POST `/api/ai/simulate/` — Run financial scenario simulation. (Auth required)
  - Body: `{ scenario, amount, current_score?, details? }`
  - Deducts credits (10) for simulation.

- GET `/api/ai/spending-analysis/` — Returns latest AI spending analysis or triggers one. (Auth required)
- GET `/api/ai/budget-advice/` — Deterministic budget tips based on 50/30/20 rule. (Auth required)

- Loans and credit:
  - GET `/api/ai/loans/` — List user's loans. (Auth required)
  - POST `/api/ai/loans/` — Create loan record. (Auth required)
  - POST `/api/ai/credit-analysis/` — Analyze credit health; deducts credits (10). Body: `{ loans, score }`

- Goal planning:
  - GET `/api/ai/goal-plan/` — Get AI goal plan analysis; optional `?refresh=true`. (Auth required)
  - POST `/api/ai/goal-plan/simulate/` — Simulate income change impact. (Auth required)

Notes: Many AI endpoints deduct user credits. Document creation uses RAG indexing and persists both SQL (Documents) and Mongo structured data.

---

**Transactions (`/api/transactions/`)**
- GET `/api/transactions/` — List transactions (filter by `category`). (Auth required)
- POST `/api/transactions/` — Create a transaction. (Auth required)
- POST `/api/transactions/bulk/` — Bulk import transactions (body: list of transaction objects). (Auth required)
- GET `/api/transactions/summary/` — Aggregated month summary (income/expenses, categories, savings). (Auth required)

Notes: creation invalidates cache keys used by health calculators.

---

**AI Goal Planner (`/api/goals/`)**
- GET `/api/goals/` — List user's savings goals. (Auth required)
- POST `/api/goals/` — Create a new savings goal. (Auth required)
- GET/PUT/PATCH/DELETE `/api/goals/<id>/` — Retrieve/update/delete a goal. (Auth required)

Notes: this module powers the AI Goal Planner experience. Updates trigger milestone notifications and progress checks.

---

**Gamification (`/api/gamification/`)**
- GET `/api/gamification/challenges/` — List global challenges. (Auth required)
- GET `/api/gamification/my-challenges/` — User's challenges (auto-seeds missing). (Auth required)
- POST `/api/gamification/my-challenges/<id>/toggle/` — Toggle challenge completion. (Auth required)
- GET `/api/gamification/badges/` — All badge definitions. (Auth required)
- GET `/api/gamification/my-badges/` — User's earned badges. (Auth required)
- GET `/api/gamification/summary/` — Combined overview (challenges, badges, streaks). (Auth required)

---

**Reports (`/api/reports/`)**
- GET `/api/reports/` — List user's generated reports. (Auth required)
- POST `/api/reports/` — Generate and store a monthly financial report (calls `generate_monthly_report` service). (Auth required)

---

## Other notes & suggestions
- Auth: endpoints returning tokens use `rest_framework_simplejwt` in `users.views.refresh_token_view`.
- Credit billing: document processing, simulations, and credit-analysis deduct user credits. Clients must handle `402 PAYMENT REQUIRED` when credits insufficient.
- Side-effects: several endpoints create notifications; bulk operations invalidate cache keys used by financial health computations.
- Pagination: general list endpoints use page-size `20` by default where configured.

## Next steps (optional)
- Generate OpenAPI/Swagger from views/serializers (DRF `SchemaGenerator` or `drf-yasg`).
- Expand this document with concrete request/response JSON schema examples for each endpoint (can be auto-generated from serializers).
- Add rate-limiting and quota notes for LLM-heavy endpoints.

---

Document generated by code analysis on the workspace. If you want, I can:
- produce an OpenAPI spec (YAML/JSON), or
- add request/response examples per endpoint using the serializers.

