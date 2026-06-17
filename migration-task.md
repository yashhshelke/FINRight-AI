# TASK: REPLACE OLD FRONTEND WITH NEW LOVABLE UI AND CONNECT FULL DJANGO BACKEND

You are a senior Full Stack Engineer.

Your task is NOT to redesign the application.

Your task is to migrate the existing project so that the extracted Lovable UI located inside:

```txt
/new-ui
```

becomes the primary frontend of the application.

The existing backend, database models, API endpoints, business logic, authentication system, AI services, OCR pipeline, RAG system, and financial engines must remain intact.

---

# OBJECTIVE

Replace:

```txt
/frontend
```

with

```txt
/new-ui
```

while preserving 100% backend functionality.

The final result should be:

```txt
Django Backend
        ↓
REST APIs
        ↓
New Lovable UI
        ↓
Production Ready
```

---

# IMPORTANT RULES

DO NOT:

* Delete backend code
* Remove API endpoints
* Remove database models
* Remove business logic
* Remove AI functionality
* Remove authentication

DO:

* Connect existing APIs
* Connect existing database data
* Replace mock data
* Build missing pages
* Build missing components
* Build missing dashboards

---

# STEP 1 — ANALYZE PROJECT

Perform a complete audit of:

```txt
backend/
frontend/
new-ui/
```

Generate a mapping document showing:

Old Frontend Page
↓
Matching New UI Page
↓
Missing Features

Example:

Overview Page
→ Exists in new-ui
→ Requires API integration

AI Coach
→ Missing
→ Build from scratch

Goals
→ Partial
→ Complete implementation

---

# STEP 2 — MAKE NEW-UI PRIMARY

Convert new-ui into the main frontend.

Requirements:

* Update project structure
* Update package references
* Update build configuration
* Update environment variables
* Update deployment configuration

Final structure:

```txt
backend/
frontend/ (new-ui contents)
```

or

```txt
backend/
new-ui/
```

depending on project architecture.

Ensure production builds succeed.

---

# STEP 3 — CONNECT AUTHENTICATION

Connect existing Django auth system.

Integrate:

* Login
* Register
* Logout
* Refresh Token
* Forgot Password
* Email Verification
* Onboarding

Remove all mock authentication.

Use real APIs.

Maintain JWT authentication.

Persist sessions properly.

---

# STEP 4 — API INTEGRATION AUDIT

Find ALL hardcoded/mock/static data.

Replace with backend APIs.

Examples:

Replace:

```js
const balance = 25000;
```

with

```js
GET /api/dashboard/
```

Use:

* React Query
* SWR
* Zustand integration

where appropriate.

---

# STEP 5 — CONNECT ALL EXISTING MODULES

Implement API integration for:

Overview Dashboard

Transactions

Goals

AI Coach

Spending Insights

Budget Optimizer

UPI Analyzer

Documents

Emergency Fund

Income Simulator

Challenges

Education

Cards

Settings

Billing

Use existing backend endpoints whenever available.

---

# STEP 6 — BUILD MISSING PAGES

If backend functionality exists but UI is missing:

Build the UI.

Do NOT remove functionality.

Examples:

If backend contains:

```txt
Goal Plan AI
```

but UI missing

→ Build Goal Plan interface.

If backend contains:

```txt
Financial Health Score
```

but UI missing

→ Build Health Dashboard.

---

# STEP 7 — AI COACH

Fully connect:

```txt
POST /api/ai/chat/
GET /api/ai/chat/history/
```

Support:

* Chat history
* Streaming responses
* Typing indicator
* Citations
* File upload
* Conversation persistence

Remove mock messages.

Use real backend data.

---

# STEP 8 — DOCUMENT INTELLIGENCE

Connect:

```txt
Document Upload
OCR
Expense Extraction
RAG
Summaries
```

Requirements:

* Upload progress
* Processing status
* Results page
* Error handling

Use real backend APIs.

---

# STEP 9 — FINANCIAL HEALTH ENGINE

Connect:

* Health Score
* Recommendations
* Breakdown
* Risk Analysis

Create:

* Health Gauge
* Score Cards
* Recommendation Cards

Use backend calculations only.

Do not calculate on frontend.

---

# STEP 10 — GOALS SYSTEM

Connect:

* Goals CRUD
* Goal Probability
* Goal Simulation
* Goal Feasibility
* Goal Planning AI

Build missing widgets if necessary.

---

# STEP 11 — TRANSACTIONS

Connect:

* Transactions List
* Search
* Filters
* Categories
* Pagination
* Add Transaction

Support:

* Manual Entry
* OCR Imports
* PDF Imports

---

# STEP 12 — SPENDING INSIGHTS

Connect:

* Spending Analysis
* Category Breakdown
* Merchant Analysis
* Spending Personality
* Subscription Detection

Build charts using:

* Recharts
* Tremor
* ECharts

---

# STEP 13 — BUDGET OPTIMIZER

Connect:

* Budget Advice
* 50/30/20 Analysis
* What-if Simulations

Use backend recommendations.

---

# STEP 14 — GAMIFICATION

Connect:

* Challenges
* Streaks
* Badges
* Rewards

Use backend APIs.

---

# STEP 15 — ERROR HANDLING

Implement:

* Global Error Boundary
* API Error Handling
* Retry Logic
* Empty States
* Skeleton Loaders

No blank screens.

---

# STEP 16 — RESPONSIVE DESIGN

Verify:

Desktop

Tablet

Mobile

All pages must work properly.

---

# STEP 17 — CODE QUALITY

Refactor:

* Duplicate components
* Unused files
* Dead code
* Broken imports

Maintain:

* Type safety
* Clean architecture
* Reusable components

---

# STEP 18 — FINAL AUDIT

Generate a report:

Features Connected

Features Missing

Backend Endpoints Used

Pages Completed

Pages Pending

Bugs Found

Recommended Improvements

Do not stop until every backend feature has either:

1. Been connected to the new UI

or

2. Has a clearly documented reason why it cannot be connected.

Goal:

Transform the extracted Lovable UI into the primary production frontend while preserving and exposing 100% of the existing Django backend capabilities.
