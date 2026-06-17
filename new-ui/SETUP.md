# Finexa AI — New UI Setup Guide

## Prerequisites

- Node.js 18+ or Bun 1.x
- Django backend running (see `backend/README.md`)
- PostgreSQL (or SQLite for local dev)

---

## Quick Start

### 1. Start the Django Backend

```bash
cd backend
# Activate virtualenv
.venv/Scripts/activate        # Windows
# source .venv/bin/activate   # macOS/Linux

python manage.py migrate
python manage.py runserver
# Backend runs at http://localhost:8000
```

### 2. Start the New UI

```bash
cd new-ui

# Copy env file
cp .env .env.local
# Edit .env.local if your backend runs on a different port

# Install dependencies
bun install
# or: npm install

# Start dev server
bun dev
# or: npm run dev
# UI runs at http://localhost:3000
```

### 3. Or start both from root

```bash
# Terminal 1
npm run backend

# Terminal 2
npm run newui
```

---

## Environment Variables

Create `new-ui/.env.local` (never commit secrets):

```env
# Required: Django backend URL
VITE_API_URL=http://localhost:8000

# Optional: For AI streaming via Lovable Gateway (/api/chat route)
# LOVABLE_API_KEY=your_key_here
```

---

## First-Time Setup

1. Open `http://localhost:3000`
2. Click **Get started** → Register with email + password
3. Complete the 5-step onboarding (income, goals, savings target, profile, confirm)
4. You'll land on the Overview dashboard with live data from Django

---

## Development Notes

### Tech Stack
- **Framework:** TanStack Start (React 19 + TanStack Router)
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`)
- **State:** TanStack React Query (server state) + React context (auth)
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **UI Components:** Radix UI primitives (shadcn/ui style)

### Folder Structure
```
new-ui/src/
├── components/
│   ├── fingo/          ← App-specific components (AppShell, HealthGauge, etc.)
│   └── ui/             ← Base UI components (shadcn/ui)
├── lib/
│   ├── api/            ← All backend API clients
│   └── auth-context.tsx ← Auth state
├── routes/
│   ├── __root.tsx      ← Root layout + QueryClient + AuthProvider
│   ├── index.tsx       ← Landing page
│   ├── auth.*.tsx      ← Auth pages
│   ├── onboarding.tsx  ← Onboarding flow
│   └── app.*.tsx       ← Dashboard pages (protected)
└── styles.css          ← Global styles + design tokens
```

### Design Tokens (CSS Variables)

| Token | Value | Usage |
|---|---|---|
| `--brand` | Dark teal | Primary brand |
| `--brand-light` | Bright teal | Accents, icons |
| `--cta` | Orange | Call-to-action buttons |
| `--background` | Dark navy | Page background |
| `--surface` | Slightly lighter | Card backgrounds |
| `--foreground` | Off-white | Primary text |
| `--muted-foreground` | Grey | Secondary text |
| `--success` | Green | Positive values |
| `--warning` | Amber | Caution states |
| `--error` | Red | Errors, negative |

Light mode available via `.light` class on `<html>`.

---

## Build for Production

```bash
cd new-ui
bun run build
# Output in .output/ (Nitro build for Cloudflare/Node deployment)
```

---

## Common Issues

| Issue | Fix |
|---|---|
| CORS errors from browser | Ensure `CORS_ALLOW_ALL_ORIGINS = True` in Django settings (already set) |
| 401 on all requests | Check that Django is running at `VITE_API_URL` |
| WebSocket connection failed | AI Coach falls back to HTTP automatically |
| `routeTree.gen.ts` stale | Run `bun dev` once — TanStack Router auto-regenerates it |
| Blank dashboard | Add transactions via the "Add" button to see data |
