# Finexa AI — Backend API Design

**Last updated:** 2026-06-12  
**Base URL (local):** `http://localhost:8000`  
**Auth scheme:** JWT — `Authorization: Bearer <access_token>`

---

## Table of Contents
1. [Base routing](#base-routing)
2. [Authentication model](#authentication-model)
3. [Credit system](#credit-system)
4. [Users API](#users-api)
5. [AI Assistant API](#ai-assistant-api)
   - [Document pipeline](#document-pipeline)
   - [RAG Chat](#rag-chat)
   - [Financial intelligence](#financial-intelligence)
   - [Financial health score](#financial-health-score)
   - [Spending & budget](#spending--budget)
   - [Loans & credit](#loans--credit)
   - [Goal planning](#goal-planning)
   - [Daily briefing](#daily-briefing)
   - [Knowledge base](#knowledge-base)
6. [Transactions API](#transactions-api)
7. [Savings Goals API](#savings-goals-api)
8. [Gamification API](#gamification-api)
9. [Reports API](#reports-api)
10. [Service layer architecture](#service-layer-architecture)
11. [Error reference](#error-reference)
12. [Notes & next steps](#notes--next-steps)

---

## Base routing

Defined in `core/urls.py`:

| Prefix | App | Notes |
|---|---|---|
| `/auth/` | `users.urls` | Auth + profile (also mirrored at `/api/users/`) |
| `/api/users/` | `users.urls` | Same views, second mount |
| `/api/ai/` | `ai_assistant.urls` | All AI features |
| `/api/transactions/` | `transactions.urls` | Transactions CRUD |
| `/api/goals/` | `savings_goals.urls` | Savings goals |
| `/api/gamification/` | `gamification.urls` | Challenges & badges |
| `/api/reports/` | `reports.urls` | Financial reports |

---

## Authentication model

- **JWT** via `rest_framework_simplejwt`.
- Access token lifetime: short (configured in settings).
- Refresh token lifetime: longer-lived.
- All endpoints marked `(auth)` require `Authorization: Bearer <access_token>`.
- Public endpoints are explicitly marked `(public)`.

---

## Credit system

Several AI endpoints consume **user credits**. When the user has insufficient credits the response is:

```
HTTP 402 Payment Required
{ "error": "Insufficient credits. Required: N" }
```

| Endpoint | Credit cost |
|---|---|
| `POST /api/ai/document/process/` | **5 credits** (refunded on duplicate or no-file) |
| `POST /api/ai/simulate/` | **10 credits** |
| `POST /api/ai/credit-analysis/` | **10 credits** |
| `GET /api/ai/goal-plan/?refresh=true` | **15 credits** |

---

## Users API

**Mounted at `/auth/` and `/api/users/`**

### Auth endpoints (public)

#### `POST /register/`
Register a new user account.

**Request body:**
```json
{
  "full_name": "Atharva Shah",
  "email": "atharva@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "age": 24,
  "occupation": "Engineer",
  "monthly_income": 80000,
  "financial_goals": "Build emergency fund",
  "city": "Mumbai"
}
```
*Optional fields:* `age, occupation, monthly_income, financial_goals, city`

**Response `201`:**
```json
{ "user": { "id": 1, "email": "...", "full_name": "..." } }
```

---

#### `POST /login/`
**Request body:** `{ "email": "...", "password": "..." }`  
**Response `200`:** `{ "access": "...", "refresh": "...", "user": { ... } }`

---

#### `POST /refresh/`
**Request body:** `{ "refresh": "<token>" }`  
**Response `200`:** `{ "access": "..." }`

---

#### `POST /verify-email/`
Verify email with token sent by email. Body: `{ "token": "..." }`

#### `POST /send-verification-email/`
Resend verification email. Body: `{ "email": "..." }`

#### `POST /forgot-password/`
Send password reset email. Body: `{ "email": "..." }`

#### `POST /reset-password/`
Reset password. Body: `{ "token": "...", "password": "...", "password_confirm": "..." }`

---

### Profile & settings endpoints (auth)

#### `GET /me/`
Returns the authenticated user's profile.

#### `PUT /profile/update/`
Update basic profile. Body: `{ "first_name": "...", "last_name": "...", "income": 80000 }`

#### `GET /profile/full/`
Full profile including settings and financial summary.

#### `POST /onboarding/`
Submit onboarding data. Body: `{ "income": 80000, "spending_categories": [...] }`

#### `POST /purchase-credits/`
Add AI credits. Body: `{ "amount": 100 }`

#### `POST /change-password/`
Body: `{ "old_password": "...", "new_password": "...", "new_password_confirm": "..." }`

#### `POST /export-data/`
Export user data (transactions, notifications, settings) as JSON download.

---

### Notifications (auth)

| Method | Path | Description |
|---|---|---|
| `GET` | `/notifications/` | List notifications |
| `POST` | `/notifications/<id>/read/` | Mark single as read |
| `POST` | `/notifications/mark-all-read/` | Mark all as read |
| `DELETE` | `/notifications/<id>/delete/` | Delete notification |

---

### Settings (auth)

| Method | Path | Description |
|---|---|---|
| `GET` | `/settings/` | Get user settings |
| `PUT/PATCH` | `/settings/` | Update settings |

---

## AI Assistant API

**Mounted at `/api/ai/`**  
All endpoints require authentication unless noted.

---

### Document pipeline

#### `POST /api/ai/document/process/`
**Cost: 5 credits**

Upload a PDF, image, or text file. The pipeline:
1. Extracts raw text (OCR or PDF parser)
2. Calls LLM to extract structured expense JSON
3. Saves encrypted structured data to MongoDB (`extracted_data` field)
4. Creates `Document` record in SQL + `DocumentChunk` records (encrypted, for RAG)
5. Creates `Transaction` records from extracted expenses

**Request:** `multipart/form-data`, field `file`

**Response `200` (duplicate detected — refunded):**
```json
{
  "message": "Document already exists (deduplicated)",
  "document_id": 7,
  "sql_document_id": 7,
  "mongo_id": "64f...",
  "summary": "...",
  "transactions_created": 0,
  "rag_chunks_indexed": 0
}
```

**Response `201` (new document):**
```json
{
  "document_id": 8,
  "sql_document_id": 8,
  "mongo_id": "64f...",
  "summary": "Extracted 14 expense records totalling ₹23,400",
  "transactions_created": 14,
  "rag_chunks_indexed": 6
}
```

**Error responses:**
- `400` — no file provided
- `402` — insufficient credits
- `500` — extraction or LLM failure

---

#### `GET /api/ai/documents/`
List all uploaded documents for the authenticated user.

**Response:**
```json
[
  {
    "id": 8,
    "file_name": "bank_statement_may.pdf",
    "uploaded_at": "2026-06-01T10:00:00Z",
    "mongo_doc_id": "64f...",
    "summary": "..."
  }
]
```

---

#### `GET /api/ai/documents/<document_id>/content/`
Return raw extracted text and metadata for a specific document.

**Response:**
```json
{
  "id": 8,
  "content": "Raw extracted text...",
  "summary": "...",
  "uploaded_at": "..."
}
```

---

#### `GET /api/ai/expense-document/<mongo_id>/summary/`
Summary computed from Mongo `extracted_data` (totals, categories, merchants).

**Response:**
```json
{
  "total_amount": 23400.00,
  "record_count": 14,
  "biggest_category": "Food",
  "top_merchants": ["Swiggy", "Amazon", "Netflix"],
  "currency": "INR",
  "suggestions": [
    "Most of your spending went to Food. Consider setting a budget limit here.",
    "Tracking these expenses regularly will help maintain your financial health."
  ]
}
```

> **Service:** `spending_insights.summarize_document_expenses()` (previously `expense_summary.summarize_expenses_from_data`)

---

#### `GET /api/ai/expense-document/<mongo_id>/suggestions/`
Saving tips derived from the document's expense categories.

**Response:**
```json
{
  "suggestions": [
    "You spent ₹4,200 on dining. Cooking at home 2 extra days a week could save ₹1,260/month.",
    "You spent ₹6,800 on shopping. A 48-hour cool-off rule cuts impulse buys significantly."
  ]
}
```

> **Service:** `recommendation_engine.suggest_document_savings()` (previously `expense_suggestions.generate_saving_suggestions`)

---

### RAG Chat

#### `POST /api/ai/chat/`
RAG-powered chat grounded in the user's uploaded documents.

**Request body:**
```json
{
  "question": "How much did I spend on Swiggy last month?",
  "document_id": 8,
  "mongo_id": "64f...",
  "session_id": null
}
```
*All optional except `question`. `document_id` restricts retrieval to one document. `mongo_id` maps to a SQL `Document` via `mongo_doc_id` field.*

**Security model:**
- Retrieval is performed against SQL `DocumentChunk` table only (AES-encrypted `EncryptedTextField`)
- MongoDB is **never queried for retrieval** — it stores only encrypted structured metadata (`extracted_data`)
- LLM receives only the top-K retrieved chunk snippets (≤5 × 800 chars), never raw JSON or full document text
- Legacy documents uploaded before chunked indexing return `409` — user must re-upload

**Response `200`:**
```json
{
  "answer": "You spent ₹2,340 on Swiggy across 6 orders last month.",
  "sources": [
    { "document_name": "bank_statement_may.pdf", "preview": "...Swiggy 390...", "relevance_score": 0.91 }
  ],
  "session_id": 12
}
```

**Error `409`** — legacy document without SQL chunks:
```json
{
  "error": "This document was uploaded before the new secure storage system was introduced. Please re-upload your PDF to enable chat."
}
```

---

#### `GET /api/ai/chat/history/`
Returns the authenticated user's global chat session message history.

**Response:** Array of `{ id, role ("user"|"assistant"), text, time }`

---

#### `GET /api/ai/chat-sessions/`
List all chat sessions for the user.

#### `GET /api/ai/chat-sessions/<session_id>/messages/`
Messages within a specific chat session.

---

### Financial intelligence

#### `POST /api/ai/intelligence/`
Auto-detects user intent from the question, routes to the appropriate deterministic financial tool, and returns a structured AI-style response.

**Request body:**
```json
{
  "question": "What is my savings rate this month?",
  "month": "2026-06-01",
  "amount": null,
  "purchase_amount": null,
  "horizon_months": null
}
```

**Response `200`:**
```json
{
  "insight": "Your savings rate this month is 22%, which is above the 20% target.",
  "recommendation": "Consider increasing contributions to your top savings goal.",
  "risk_level": "low",
  "source": "Finexa Financial Engine",
  "confidence": "high",
  "tool": "get_cashflow_analysis",
  "data": { ... }
}
```

---

#### `POST /api/ai/tools/`
Direct access to any named backend financial tool.

**Request body:**
```json
{
  "tool": "get_category_breakdown",
  "question": "Show my category breakdown",
  "month": "2026-06-01"
}
```

**Available tools** (routed by `financial_engine.route_financial_tool`):

| Tool name | Description |
|---|---|
| `get_income_summary` | Income for the period |
| `get_monthly_spending` | Total expense for the period |
| `get_category_breakdown` | Expense by category with % |
| `get_cashflow_analysis` | Income vs expenses, savings rate |
| `get_budget_status` | 50/30/20 status |
| `get_goal_progress` | All savings goals progress |
| `get_subscription_analysis` | Recurring spend detection |
| `get_subscription_hunter` | Brand-level subscription audit |
| `get_expense_forecast` | 3-month average → next month forecast |
| `get_affordability_analysis` | Can the user afford a purchase/EMI? |
| `get_financial_health_score` | Quick composite health score (no DB write) |
| `get_investment_readiness_score` | Investment readiness assessment |
| `get_monthly_report` | Full month summary |

**Response:** Same shape as `/intelligence/` plus `tool` and `data` fields.

---

#### `POST /api/ai/goal-investment/`
Deterministic SIP calculator and multi-goal investment roadmap.

**Request body (single goal):**
```json
{
  "goal_amount": 500000,
  "years": 3,
  "current_amount": 50000,
  "expected_return_pct": 12.0,
  "title": "Emergency Fund"
}
```

**Request body (multi-goal):**
```json
{
  "goals": [
    { "title": "Car", "target_amount": 400000, "current_amount": 0, "years": 2 },
    { "title": "Laptop", "target_amount": 80000, "current_amount": 10000, "years": 0.5 }
  ]
}
```

**Response `200`:**
```json
{
  "insight": "You need ₹12,340/month via SIP to reach your Emergency Fund goal in 3 years.",
  "recommendation": "Start with a balanced or short-duration debt fund for 3-year goals.",
  "risk_level": "medium",
  "source": "Finexa Financial Engine",
  "confidence": "high",
  "tool": "goal_investment",
  "data": {
    "plans": [
      {
        "title": "Emergency Fund",
        "target_amount": 500000,
        "required_sip": 12340,
        "total_invested": 494400,
        "projected_corpus": 500450,
        "months": 36,
        "call_to_action": "..."
      }
    ],
    "available_monthly_surplus": 18000
  }
}
```

---

#### `GET /api/ai/subscription-hunter/`
Detect recurring subscriptions and flag inactive ones for cancellation.

**Query params:** `lookback_days` (default: 180)

**Response `200`:**
```json
{
  "insight": "I found 3 subscription pattern(s) and ₹650.00 in recoverable monthly savings.",
  "recommendation": "Cancel inactive subscriptions first and review active ones monthly.",
  "risk_level": "medium",
  "source": "Finexa Subscription Hunter",
  "confidence": "high",
  "tool": "subscription_hunter",
  "data": {
    "subscription_count": 3,
    "inactive_subscription_count": 1,
    "subscriptions": [
      {
        "brand": "Netflix",
        "occurrences": 6,
        "last_seen_at": "2026-04-15T00:00:00Z",
        "inactive_days": 58,
        "estimated_monthly_cost": 649.0,
        "status": "inactive",
        "cancel_recommended": true,
        "recommendation": "You haven't used Netflix for 58 days. Cancel it if you do not plan to resume."
      }
    ],
    "estimated_monthly_cost": 1800.0,
    "recoverable_monthly_savings": 650.0
  }
}
```

---

#### `GET /api/ai/money-replay/`
Month-end shareable story slides (the "Finexa Wrapped").

**Query params:** `month` (ISO date string, e.g. `2026-05-01`; defaults to current month)

**Response `200`:**
```json
{
  "insight": "June Money Replay from Finexa: income ₹80,000, savings ₹18,000, health score 74/100.",
  "tool": "money_replay",
  "data": {
    "title": "Your June Story",
    "period": "2026-06-01",
    "slides": [
      { "id": "cover", "title": "Your June Story", "emoji": "✨", "metric": null },
      { "id": "income", "title": "Income", "emoji": "💰", "metric": "₹80,000" },
      { "id": "savings", "title": "Savings", "subtitle": "Savings rate 22%", "emoji": "🌱", "metric": "₹18,000" }
    ],
    "summary": {
      "income": 80000,
      "savings": 18000,
      "financial_health_score": 74
    },
    "share_caption": "..."
  }
}
```

---

### Financial health score

Five dedicated endpoints served from `financial_health_views.py`.  
The score is a **0–100 composite** of five weighted factors (each 0–20):

| Factor | What it measures |
|---|---|
| `spending_discipline` | Expense/income ratio + consistency + category diversity |
| `savings_ratio` | Savings rate + emergency fund adequacy |
| `credit_utilization` | Missed EMI count on active loans |
| `loan_burden` | Debt-to-income ratio from active loans |
| `risk_exposure` | Emergency fund size + income stability variance |

Final score blends 60% expense-to-income ratio + 40% factor scores.
Results are written to `FinancialHealthScore` and `ScoreFactorDetail` SQL models.  
Score is **cached for 1 hour** (Redis/in-memory).

---

#### `GET /api/ai/financial-health/score/`
Get (or calculate) the current month's health score.

**Response `200`:**
```json
{
  "score": 74,
  "category": "Good",
  "color": "#4CAF50",
  "month": "2026-06-01",
  "calculation_date": "2026-06-12T10:30:00Z",
  "income": 80000.00,
  "expenses": 62000.00,
  "expense_ratio": 0.775,
  "factors": {
    "spending_discipline": 14,
    "savings_ratio": 12,
    "credit_utilization": 20,
    "loan_burden": 18,
    "risk_exposure": 10
  },
  "explanation": "Financial Health Score: 74/100\n\nIncome: 80,000 | Expenses: 62,000 ...",
  "recommendations": [
    { "title": "Optimize Spending", "description": "...", "priority": "medium" }
  ]
}
```

---

#### `GET /api/ai/financial-health/history/`
Score history for up to 24 months.

**Query params:** `months` (default 12, max 24)

**Response `200`:**
```json
{
  "history": [
    { "month": "2026-05-01", "score": 68, "category": "Fair", "color": "...", "factors": { ... } }
  ],
  "trend": "up",
  "change": 6,
  "total_months": 2
}
```

---

#### `GET /api/ai/financial-health/breakdown/`
Factor-level detail with per-factor metrics and explanations.

**Response `200`:**
```json
{
  "overall_score": 74,
  "category": "Good",
  "month": "2026-06-01",
  "factors": [
    {
      "name": "spending_discipline",
      "display_name": "Spending Discipline",
      "score": 14,
      "max_score": 20,
      "weight": 0.2,
      "percentage": 70.0,
      "metrics": { "income": 80000, "expenses": 62000, "spend_ratio": 0.775, "tx_count": 42 },
      "explanation": "Spending Discipline: 14/20 — Spend ratio 78%, 42 transactions across 7 categories."
    }
  ]
}
```

---

#### `POST /api/ai/financial-health/recalculate/`
Force-recalculate the score (optionally for a past month).

**Request body:** `{ "month": "2026-05-01" }` *(optional, defaults to current month)*

**Response `201`:**
```json
{
  "success": true,
  "message": "Score recalculated successfully",
  "score": 74,
  "category": "Good",
  "color": "...",
  "month": "2026-06-01",
  "calculation_date": "...",
  "factors": { ... },
  "recommendations": [ ... ]
}
```

---

#### `GET /api/ai/financial-health/recommendations/`
Personalized recommendations from the latest score.

**Response `200`:**
```json
{
  "score": 74,
  "category": "Good",
  "recommendations": [
    { "title": "Optimize Spending", "description": "Expenses are 78% of income. Aim for 50-60%.", "priority": "medium" }
  ]
}
```

---

### Spending & budget

#### `GET /api/ai/spending-analysis/`
Latest AI-powered spending analysis from SQL transactions.  
Cached for 24 hours; use `?refresh=true` to force a new run.

**Query params:** `refresh=true` (optional)

**Response `200`:**
```json
{
  "period": "Last 30 Days",
  "total_spent": 62000.0,
  "by_category": [
    { "category": "Food", "amount": 18400.0, "pct": 30 },
    { "category": "Rent", "amount": 22000.0, "pct": 35 }
  ],
  "patterns": [
    "You made 42 expense transactions in last 30 days totalling ₹62,000.",
    "Your highest spending category is Rent (₹22,000, 35% of total expenses)."
  ],
  "anomalies": [],
  "recommendations": [
    {
      "title": "Reduce Discretionary Spend",
      "description": "Reducing discretionary expenses by 10% can meaningfully improve your savings rate.",
      "potential_savings": "₹1,860"
    }
  ]
}
```

> **Service:** `spending_insights.analyze_user_spending()` (previously `spending_analysis.analyze_user_spending`)

---

#### `GET /api/ai/budget-advice/`
Deterministic 50/30/20 budget gap analysis. No credits required.

**Response `200`:**
```json
{
  "tips": [
    {
      "tip": "Your discretionary spending on Entertainment is high. Cut back to reach the 30% guideline.",
      "category": "Entertainment",
      "save_per_month": 2400
    }
  ],
  "income": 80000.0,
  "expense": 62000.0,
  "savings": 18000.0
}
```

---

### Loans & credit

#### `GET /api/ai/loans/`
List all loans for the authenticated user.

**Response:** Array of loan objects `{ id, loan_type, principal, interest_rate, tenure_months, monthly_emi, status, missed_emis, created_at }`

#### `POST /api/ai/loans/`
Create a new loan record.

**Request body:**
```json
{
  "loan_type": "home_loan",
  "principal": 3000000,
  "interest_rate": 8.5,
  "tenure_months": 240,
  "monthly_emi": 26100,
  "status": "ACTIVE"
}
```

---

#### `POST /api/ai/simulate/`
**Cost: 10 credits**

Simulate the credit-score impact of a financial decision.

**Request body:**
```json
{
  "scenario": "new_loan",
  "amount": 500000,
  "current_score": 750,
  "details": {}
}
```

**Supported scenario values:** `new_loan`, `personal_loan`, `home_loan`, `auto_loan`, `new_credit_card`, `credit_card`, `missed_emi`, `default`, `missed_payment`, `loan_payoff`, `early_closure`, `payoff`

**Response `200`:**
```json
{
  "impact_points": -15,
  "new_score": 735,
  "risk_level": "MEDIUM",
  "score_trend": "DECLINING",
  "analysis": "This scenario is estimated to reduce your score by 15 points. Overall risk is MEDIUM and trend is Declining.",
  "key_observations": [
    "Applying for a ₹500,000 loan triggers a hard inquiry.",
    "It temporarily lowers your score and increases credit utilization."
  ],
  "recommendations": [
    "Don't apply for multiple loans within a 6-month period.",
    "Set up auto-pay to ensure timely EMI payments once approved."
  ],
  "critical_warnings": []
}
```

> **Service:** `financial_health.simulate_financial_impact()` (previously `simulation_service`)

---

#### `POST /api/ai/credit-analysis/`
**Cost: 10 credits**

Analyse the user's full loan portfolio and credit health.

**Request body:**
```json
{
  "loans": [
    { "principal": 500000, "emi": 12500, "missed_emis": 0 }
  ],
  "score": 750
}
```

**Response `200`:**
```json
{
  "risk_level": "LOW",
  "score_trend": "IMPROVING",
  "predicted_score_range": "760 - 775",
  "analysis": "You are managing active loans correctly with no missed payments.",
  "key_observations": ["You hold 1 active loan(s) with a total EMI of ₹12,500."],
  "recommended_actions": ["Continue paying all EMIs on time, before the due date."],
  "critical_warnings": []
}
```

> **Service:** `financial_health.analyze_credit_health()` (previously `simulation_service`)

---

### Goal planning

#### `GET /api/ai/goal-plan/`
AI-powered goal feasibility analysis (LLM-backed, cached 12 hours).

**Query params:** `refresh=true` — forces re-analysis, **costs 15 credits**

**Response `200`:** Large structured object containing:
```json
{
  "goals_analysis": [
    {
      "goal_id": 3,
      "goal_title": "Emergency Fund",
      "feasibility_pct": 85,
      "feasibility_status": "Highly Feasible",
      "achievement_probability_pct": 80,
      "risk_adjusted_probability_pct": 72,
      "probability_explanation": "...",
      "required_monthly": 8333,
      "savings_gap": 0,
      "delay_months": 0,
      "adjusted_completion_date": "2027-06-01",
      "budget_suggestions": ["Reduce dining spend by ₹2,000/month"],
      "timeline_category": "medium-term"
    }
  ],
  "prioritization": {
    "ranked_goals": [ { "goal_id": 3, "rank": 1, "recommended_monthly_allocation": 8333, "reason": "..." } ],
    "strategy_summary": "...",
    "over_allocated": false,
    "total_recommended_monthly": 8333
  },
  "investment_suggestions": [ ... ],
  "income_simulation": {
    "drop_10_pct": { "new_disposable": 16200, "goals_impacted": [], "delay_added_months": 0, "adjustment_needed": "..." },
    "drop_20_pct": { ... },
    "increase_10_pct": { "new_disposable": 19800, "time_saved_months": 2, "benefit": "..." }
  },
  "coaching": {
    "messages": ["..."],
    "weekly_challenge": "...",
    "automatic_transfer_suggestion": "...",
    "habit_tip": "..."
  },
  "overall_summary": "..."
}
```

> **Note:** If analysis fails (LLM busy), returns a deterministic fallback with `"degraded": true`.

---

#### `POST /api/ai/goal-plan/simulate/`
Simulate the impact of an income change on all active goals.

**Request body:** `{ "change_pct": -20 }` *(negative = income drop, positive = increase)*

**Response `200`:**
```json
{
  "original_income": 80000,
  "new_income": 64000,
  "change_pct": -20,
  "original_disposable": 18000,
  "new_disposable": 2000,
  "goals_impact": [
    {
      "goal_id": 3,
      "title": "Emergency Fund",
      "original_contribution": 8333,
      "adjusted_contribution": 926.0,
      "delay_months": 75,
      "needs_adjustment": true
    }
  ]
}
```

---

### Daily briefing

#### `GET /api/ai/daily-briefing/`
Returns today's personalised financial briefing.

**Response `200`:** Briefing object with highlights, suggested actions, and spending flags for the day.

---

### Knowledge base

#### `GET /api/ai/knowledge/search/`
Search the verified internal financial knowledge base.

**Query params:** `q` or `query` (required)

**Response `200`:**
```json
{
  "source": "Finexa Internal Knowledge Base",
  "confidence": "medium",
  "query": "SIP investment",
  "results": [
    {
      "id": "kb_sip_001",
      "title": "SIP Education",
      "topic": "sip",
      "summary": "A SIP is a disciplined way to invest a fixed amount regularly in a mutual fund.",
      "content": "A SIP spreads investing over time and helps build consistency for long-term goals.",
      "keywords": ["sip", "systematic investment plan", "mutual fund", "index fund"]
    }
  ],
  "available_articles": [ ... ]
}
```

> **Service:** `knowledge_base.search_verified_knowledge()` — uses real ML embeddings (sentence-transformers / OpenAI) via `rag_service.embed_query()`. Optionally backed by Qdrant cloud vector DB (`QDRANT_URL` env var).

---

## Transactions API

**Mounted at `/api/transactions/`**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/transactions/` | List transactions. Filter: `?category=Food` |
| `POST` | `/api/transactions/` | Create a transaction |
| `POST` | `/api/transactions/bulk/` | Bulk import (body: array of transaction objects) |
| `GET` | `/api/transactions/summary/` | Aggregated month summary |

**Transaction object:**
```json
{
  "id": 101,
  "type": "expense",
  "category": "Food",
  "amount": "450.00",
  "description": "Swiggy order",
  "date": "2026-06-10",
  "source": "manual",
  "source_document": null
}
```

**Summary response:**
```json
{
  "month": "2026-06-01",
  "income": 80000,
  "expenses": 62000,
  "savings": 18000,
  "categories": [ { "category": "Food", "total": 18400 } ]
}
```

> *Note: creating transactions invalidates the 1-hour financial health score cache.*

---

## Savings Goals API

**Mounted at `/api/goals/`**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/goals/` | List user's savings goals |
| `POST` | `/api/goals/` | Create new goal |
| `GET` | `/api/goals/<id>/` | Get goal detail |
| `PUT/PATCH` | `/api/goals/<id>/` | Update goal |
| `DELETE` | `/api/goals/<id>/` | Delete goal |

**Goal object:**
```json
{
  "id": 3,
  "title": "Emergency Fund",
  "target_amount": "100000.00",
  "current_amount": "25000.00",
  "monthly_contribution": "8333.00",
  "deadline": "2027-06-01",
  "priority": "high",
  "status": "active",
  "progress_percentage": 25.0,
  "months_left": 12,
  "required_monthly": 6250.0,
  "delay_months": 0
}
```

> *Updates trigger milestone notifications and progress checks.*

---

## Gamification API

**Mounted at `/api/gamification/`**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/gamification/challenges/` | All available challenges |
| `GET` | `/api/gamification/my-challenges/` | User's challenges (auto-seeded) |
| `POST` | `/api/gamification/my-challenges/<id>/toggle/` | Toggle completion |
| `GET` | `/api/gamification/badges/` | All badge definitions |
| `GET` | `/api/gamification/my-badges/` | User's earned badges |
| `GET` | `/api/gamification/summary/` | Challenges + badges + streaks overview |

---

## Reports API

**Mounted at `/api/reports/`**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/reports/` | List generated reports |
| `POST` | `/api/reports/` | Generate and store monthly financial report |

---

## Service layer architecture

The following diagram shows how the refactored `ai_assistant/services/` modules map to API endpoints after the consolidation session:

```
ai_assistant/services/
│
├── unified_rag_chat.py          ← ChatAPIView (POST /chat/)
│   └── imports: rag_service, llm_client
│
├── rag_service.py               ← Canonical embedding engine
│   Exports: chunk_text, embed_texts, embed_query,
│            cosine_similarity, index_document,
│            retrieve_chunks, retrieve_and_generate
│
├── knowledge_base.py            ← KnowledgeBaseSearchAPIView
│   └── imports: rag_service (embed_texts, embed_query, cosine_similarity)
│   Optional: Qdrant cloud vector DB
│
├── financial_health.py          ← financial_health_views.py + SimulationAPIView + CreditAnalysisAPIView
│   Classes: FinancialHealthCalculator
│   Functions: simulate_financial_impact, analyze_credit_health
│
├── financial_engine.py          ← FinancialToolAPIView, FinexaIntelligenceAPIView,
│                                   GoalInvestmentPlanAPIView, SubscriptionHunterAPIView,
│                                   MoneyReplayAPIView, DailyBriefingAPIView
│
├── spending_insights.py         ← ExpenseDocumentSummaryAPIView, SpendingAnalysisAPIView
│   Functions: summarize_document_expenses (was expense_summary.py)
│              analyze_user_spending (was spending_analysis.py)
│   Shared: _aggregate_expense_rows helper
│
├── recommendation_engine.py     ← ExpenseSuggestionAPIView, BudgetAdviceAPIView (future)
│   Functions: suggest_document_savings (was expense_suggestions.py)
│              suggest_category_cuts
│              suggest_budget_allocation
│
├── goal_planning.py             ← GoalPlanAnalysisAPIView, GoalIncomeSimulationAPIView
│   (intentionally kept separate — LLM calls + SQL caching tightly coupled)
│
├── expense_extraction.py        ← DocumentProcessAPIView (document ingestion pipeline)
│   MongoDB role: stores encrypted extracted_data (amounts, categories, merchants)
│   raw_text field REMOVED — no longer persisted in MongoDB
│
├── agent.py                     ← Internal agent pipeline (used by tests, not exposed directly)
├── llm_client.py                ← Shared LLM abstraction (OpenRouter / OpenAI)
└── expense_summary.py           ← DELETED (merged into spending_insights.py)
    spending_analysis.py         ← DELETED (merged into spending_insights.py)
    expense_suggestions.py       ← DELETED (merged into recommendation_engine.py)
    simulation_service.py        ← DELETED (merged into financial_health.py)
    document_chat.py             ← DELETED (merged into unified_rag_chat.py)
    expense_chat.py              ← DELETED (merged into unified_rag_chat.py)
```

### Data flow: Document upload → Chat

```
Client uploads PDF
    │
    ▼
DocumentProcessAPIView
    ├── extract_text_from_uploaded_file()    → raw text
    ├── call_llm_for_expense_extraction()    → structured JSON (expenses list)
    ├── save_expense_document_to_mongo()     → MongoDB { extracted_data: AES-encrypted JSON }
    │                                           (raw_text NOT stored)
    ├── Document.objects.create()            → SQL Document record
    └── index_document()                     → SQL DocumentChunk records
                                               (EncryptedTextField, cosine-searchable)
Client asks question
    │
    ▼
ChatAPIView → unified_rag_chat.chat_with_documents()
    ├── resolve document_id / mongo_id → SQL Document
    ├── retrieve_chunks() → top-K DocumentChunk (decrypt + embed + cosine rank)
    ├── LLM receives ONLY chunk text snippets (never raw JSON or full doc)
    └── Response: { answer, sources, session_id }
```

---

## Error reference

| HTTP status | When |
|---|---|
| `400 Bad Request` | Missing required field; invalid tool name |
| `402 Payment Required` | Insufficient user credits |
| `404 Not Found` | Document or resource not found |
| `409 Conflict` | Legacy document without SQL chunks (re-upload required) |
| `500 Internal Server Error` | Unexpected service failure; LLM timeout |

---

## Notes & next steps

### Current behaviour notes
- **Credit billing:** `document/process/`, `simulate/`, `credit-analysis/`, and `goal-plan/?refresh=true` deduct credits. Handle `402` gracefully on the client.
- **MongoDB role (post-refactor):** MongoDB Atlas stores **only** `extracted_data` (encrypted expense metadata for summary/suggestions). It is **never used for RAG retrieval**. All vector search is on SQL `DocumentChunk`.
- **Caching:** Financial health score cached 1 hour (Redis/in-memory). Spending analysis cached 24 hours via `SpendingPattern` table.
- **Celery tasks:** `tasks.py` provides background jobs for nightly financial digest, money replay report generation, goal investment plans, and periodic knowledge base syncing (when Celery broker is configured).
- **Qdrant (optional):** Set `QDRANT_URL` + `QDRANT_API_KEY` env vars to enable Qdrant for knowledge base search. Falls back to in-process cosine similarity if not configured.
- **Pagination:** List endpoints use page size 20 where configured.
- **Side-effects:** Transaction creation invalidates health score cache. Several endpoints create `Notification` records.

### Next steps
- Generate OpenAPI/Swagger spec from views/serializers (`drf-yasg` or `drf-spectacular`).
- Add rate-limiting (throttling) for LLM-heavy endpoints: `/chat/`, `/intelligence/`, `/goal-plan/`.
- Add request/response JSON schema examples per endpoint (auto-generate from serializers).
- Expose `suggest_category_cuts` and `suggest_budget_allocation` from `recommendation_engine.py` as dedicated API endpoints.
- Add `GET /api/ai/financial-health/investment-readiness/` endpoint wrapping `get_investment_readiness_score`.
