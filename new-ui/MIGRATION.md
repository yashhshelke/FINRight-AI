# Finexa AI — New UI Migration Notes

## Running the new UI

```bash
# From repo root
npm run newui

# Or directly
cd new-ui
bun dev   # or: npx vite dev
```

## Environment Variables

Copy `.env` and set your backend URL:

```
VITE_API_URL=http://localhost:8000
```

For the AI chat streaming route (`/api/chat`), set:
```
LOVABLE_API_KEY=your_lovable_key
```
> Note: The AI coach in the dashboard uses the Django backend WebSocket/HTTP directly.
> The `/api/chat` route is a fallback using the Lovable AI Gateway.

## Backend Setup

```bash
# Terminal 1 — Django backend
cd backend
.venv/Scripts/python.exe manage.py runserver

# Terminal 2 — New UI
cd new-ui
bun dev
```

## Architecture

```
Django Backend (port 8000)
       ↓ REST APIs + WebSocket
New UI / new-ui (port 3000)
       ↓ TanStack Router + React Query
```

## What was migrated

| Page | Status | Backend Connected |
|---|---|---|
| Landing / Marketing | ✅ Exists | N/A |
| Login | ✅ Real auth | POST /auth/login/ |
| Register | ✅ Real auth | POST /auth/register/ |
| Forgot Password | ✅ Real API | POST /auth/forgot-password/ |
| Onboarding | ✅ Real API | POST /auth/onboarding/ |
| Overview Dashboard | ✅ Real data | summary + health + goals + txns + briefing |
| Transactions | ✅ Real data | CRUD + pagination |
| Goals | ✅ Real data | CRUD + AI plan |
| AI Coach | ✅ WebSocket + HTTP | WS /ws/ai/chat/ + POST /api/ai/chat/ |
| Spending Insights | ✅ Real data | summary + AI analysis |
| Budget Optimizer | ✅ Real data | summary + AI tips |
| Documents | ✅ Real data | upload + OCR + summaries |
| Emergency Fund | ✅ Real data | health score + recommendations |
| Income Simulator | ✅ Real data | transaction summary |
| Challenges | ✅ Real data | gamification API |
| Learn / Education | ✅ Real data | knowledge search + AI chat |
| Cards | ✅ Real data | /api/users/cards/ |
| Billing | ✅ Real data | purchase-credits + subscription-hunter |
| Settings | ✅ Real data | profile + password + export |
| UPI Analyser | ✅ Client-side | CSV parsing in browser |
