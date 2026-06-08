# Finexa AI - End-to-End Project Architecture

This document provides an exhaustive, deeply detailed architectural breakdown of the entire **Finexa AI** project. From the backend database models and AI pipelines to the frontend state management and mobile applications, this guide covers how the entire platform operates end-to-end.

---

## 🏗️ 1. High-Level Architecture & Monorepo Structure

Finexa AI is structured as a **Monorepo** managed via NPM workspaces. It houses the backend API, the web application, the mobile application, and shared packages in a single repository.

```text
Finexa AI/
├── backend/            # The Django REST API (Core Engine & Database)
├── frontend/           # The React Web Dashboard (Vite + Tailwind)
├── frontend-mobile/    # The React Native Mobile App (Expo)
├── packages/           # Shared libraries (e.g., @finexa/api)
└── package.json        # Root workspace manager
```

---

## 🧠 2. The Backend Engine (Deep Dive)

The backend is built with **Python 3 and Django REST Framework**, acting as the central nervous system of the application. It handles user authentication, AI integrations, data storage, and gamification logic.

### 🛠️ Tech Stack & Core Systems
- **Framework:** Django + Django REST Framework.
- **Database:** SQLite locally, with integration for MongoDB (for storing massive, unstructured raw text and JSON outputs from the AI).
- **AI Integration:** OpenAI API (GPT-4 Turbo) for expense extraction and analysis.
- **Security & Privacy:** Financial data (Income, Amounts, Balances) and PII are encrypted at rest using custom fields (`EncryptedDecimalField`, `EncryptedTextField`).

### 📦 Django Apps Breakdown

#### A. `users` (Authentication & Profile)
Handles the entire user lifecycle.
- **Custom User Model:** Extends `AbstractUser`, storing an encrypted `income` field, and tracks `credits` for AI usage.
- **UserSettings:** Preferences for currency (INR, USD, etc.), language, dark mode, and granular notification toggles (budget alerts, goal reminders).
- **Notification System:** Robust system generating system, wallet, transaction, and goal-related alerts.
- **Cards:** Stores metadata (Last 4 digits, expiry) of user payment methods without touching raw PCI data.

#### B. `transactions` (Ledger & History)
- **Transaction Model:** Tracks Income and Expenses. Uses `EncryptedDecimalField` for amounts and `EncryptedTextField` for descriptions. Supports manual entry vs. PDF upload source tracking.

#### C. `ai_assistant` (The Core AI Engine)
This is where the magic happens. 
- **File Upload & OCR Pipeline:** 
  1. User uploads a file (PDF, CSV, Image).
  2. The system validates the file and performs text extraction using PyPDF2 (for PDFs) and Tesseract OCR (for images).
  3. The raw text is passed to **GPT-4 Turbo**, which intelligently extracts a highly structured JSON of expenses (Date, Merchant, Amount, Category).
- **DocumentChunk & RAG:** The backend splits uploaded documents into `DocumentChunk` models, storing vectorized embeddings (as JSON floats) directly in the database. This allows for Retrieval-Augmented Generation (RAG) when the user chats with the AI.
- **Wallets & Financial Health Score:** Provides an AI-calculated score (0-100) based on spending discipline, savings ratio, credit utilization, and risk exposure. It also generates tailored, actionable recommendations to improve the score.
- **SpendingPattern:** Periodically uses LLMs to analyze user transactions and stores a cached JSON of spending anomalies and patterns.

#### D. `savings_goals`
- Allows users to create financial targets with deadlines, calculating required monthly contributions.
- **GoalPlanAnalysis:** Uses the AI to cache a personalized plan on how to achieve specific savings targets based on the user's income and current spending.

#### E. `gamification`
Finexa AI applies game mechanics to personal finance to keep users engaged.
- **Challenges:** Admin-defined financial challenges (e.g., "No dining out for a week"). Users subscribe to them and maintain streaks (`UserChallenge`).
- **Badges:** Unlockable achievements linked to a user's `FinancialHealthScore`. A user with a score > 75 might unlock an "Epic" tier savings badge.

---

## 💻 3. The Web Frontend (Deep Dive)

The web client is a rich, highly interactive dashboard that visualizes the data provided by the backend API.

### 🛠️ Tech Stack & Core Systems
- **Framework:** React 18 with Vite for lightning-fast HMR and building.
- **Styling:** Tailwind CSS with PostCSS.
- **State Management:** Zustand for lightweight, global state handling (e.g., auth state, user profile).
- **Animations & Visuals:** Framer Motion for smooth micro-interactions and Recharts for beautiful financial graphs.

### 🗺️ Application Routing (`src/App.tsx`)
The app features public onboarding and heavily protected dashboard routes.

**Key Dashboard Pages:**
- `/dashboard`: The main **Overview** summarizing health scores, recent transactions, and AI insights.
- `/dashboard/transactions`: A detailed ledger of all income/expenses.
- `/dashboard/coach`: The **AICoach**, interfacing with the backend RAG system to chat with the user about their uploaded documents.
- `/dashboard/spending`: Deep **Spending Insights** using Recharts to visualize the LLM-analyzed spending patterns.
- `/dashboard/habits` & `/dashboard/goals`: The UI for the Gamification challenges and Savings Goals logic.
- `/dashboard/budget`: The **Budget Optimizer**, giving AI-generated recommendations to cut costs.
- `/dashboard/upi`: **UPI Analyser** for Indian users, parsing rapid micro-transactions.
- `/dashboard/emergency` & `/dashboard/simulator`: Advanced tools for calculating risk exposure and simulating income growth over time.

---

## 📱 4. The Mobile Frontend (Deep Dive)

To complement the web dashboard, Finexa AI features a cross-platform mobile app for iOS and Android, focusing on on-the-go data entry and AI chatting.

### 🛠️ Tech Stack
- **Framework:** React Native powered by Expo (SDK 54).
- **Navigation:** React Navigation (`@react-navigation/bottom-tabs` and `native-stack`).
- **Storage:** `expo-secure-store` for safely managing JWT authentication tokens on the device.

### 🗺️ Architecture & Screens
The mobile app relies on a fluid **Bottom Tab Navigator** with 5 core tabs:
1. **Home (`HomeScreen`):** The dashboard displaying the user's Financial Health Score, current wallet balance, and top insights.
2. **Chat (`ChatScreen`):** A conversational interface communicating directly with the Django `ai_assistant` to query expenses or ask for financial advice via RAG.
3. **Transactions (`TransactionsScreen`):** A scrollable ledger of recent purchases.
4. **Rewards (`GamificationScreen`):** The mobile view for active Challenges, streaks, and earned Badges.
5. **Profile (`ProfileScreen`):** User settings and account management.

*Note: The mobile app uses an `apiBridge` utility on initialization to intercept all API calls and inject the secure JWT token into the headers seamlessly.*

---

## 📦 5. Shared Packages & API Integration

Because Finexa AI has both a React Web App and a React Native Mobile App, they share logic to communicate with the Django backend.

- **`@finexa/api` (in `packages/api`):** 
  This workspace package holds the core Axios instances and TypeScript definitions for the backend models. By sharing this, both the mobile and web clients maintain strict type safety and a single source of truth when hitting endpoints like `POST /api/ai/expense-upload/` or `GET /api/gamification/badges/`.

---

## 🚀 6. End-to-End Data Flow Example: Document Upload

To understand how the system works end-to-end, here is the exact flow when a user uploads a bank statement:

1. **Frontend (React/Expo):** User clicks "Upload" and selects a PDF. The frontend sends a `multipart/form-data` POST request to `/api/ai/document/process/`.
2. **Backend (Django):** 
   - Receives the PDF.
   - Routes to the PyPDF2 extractor to pull raw text.
   - Slices the text into `DocumentChunk` records and creates embeddings for RAG.
   - Pings OpenAI GPT-4 to convert the raw text into structured JSON transactions.
3. **Storage (SQLite/Mongo):** 
   - Stores the generated transactions using `EncryptedDecimalField` in the `Transaction` table.
   - Updates the user's `Wallet` balance.
   - Re-calculates the `FinancialHealthScore`.
4. **Response:** Returns the structured JSON and a success code.
5. **Frontend UI:** Receives the response, updates Zustand state, and Recharts instantly redraws the user's spending graphs on the dashboard.

---

## 🏁 Summary

Finexa AI is a robust, production-grade monorepo combining secure, AI-driven Django backend logic with modern, highly interactive React and React Native frontends. Every layer is built with security (encryption at rest) and intelligence (LLM-driven analysis) at its core.
