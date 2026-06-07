# Finexa AI — React Native Integration Guide & API Documentation

This document serves as the complete technical reference for connecting a **React Native (Expo or CLI)** frontend to the Finexa AI Django Backend.

---

## 🏗️ 1. Architecture Overview

- **Backend Framework:** Django 5.2 + Django REST Framework
- **Databases:** PostgreSQL (Neon) for relational data, MongoDB (Atlas) for unstructured AI data.
- **Authentication:** JWT (JSON Web Tokens) via `djangorestframework-simplejwt`.
- **RAG Chatbot:** Locally embedded text chunks stored in Postgres (via `sentence-transformers`), querying via OpenRouter/OpenAI.
- **Base URL (Local):** `http://10.0.2.2:8000` (Android Emulator) or `http://localhost:8000` (iOS Simulator).
- **Base URL (Production):** *Your deployed domain URL*

---

## 🚀 2. React Native Setup & Best Practices

### Recommended Libraries
To interact with this backend smoothly, we recommend:
- `axios`: For making HTTP requests.
- `expo-secure-store` or `@react-native-async-storage/async-storage`: To securely store JWT tokens.
- `react-native-document-picker` or `expo-document-picker`: For uploading invoices.
- `@react-navigation/native`: For routing (Auth stack vs App stack).

### Axios Interceptor Setup
You must attach the JWT token to every protected request. Create an Axios instance that handles this automatically:

```javascript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: 'http://10.0.2.2:8000', // Use your IP or emulator localhost
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 🔐 3. Authentication Endpoints

Base path: `/auth/`

### Register
Create a new user.
- **POST** `/auth/register/`
- **Body:** `{"email": "test@finexa.ai", "username": "test", "password": "...", "password_confirm": "...", "first_name": "John"}`
- **Response (201):** Returns `user` object and `tokens` (access, refresh).

### Login
- **POST** `/auth/login/`
- **Body:** `{"email": "test@finexa.ai", "password": "..."}`
- **Response (200):** `{"access": "...", "refresh": "..."}`
- **Frontend Action:** Save both tokens to SecureStore.

### Get Current User Profile
- **GET** `/auth/me/` (Requires Auth)
- **Response (200):** User profile data (balance, tier, etc.)

---

## 🤖 4. AI Assistant & RAG Chatbot

Base path: `/api/ai/`

### Process Document (Invoice/Receipt Upload)
Uploads a document, extracts text, chunks it, embeds it in Postgres, and generates an expense summary via LLM.
- **POST** `/api/ai/document/process/` (Requires Auth)
- **Headers:** `Content-Type: multipart/form-data`
- **Body:** `file` (Supports `.pdf`, `.png`, `.jpg`, `.txt`)
- **React Native Example:**
```javascript
const formData = new FormData();
formData.append('file', {
  uri: documentUri,
  name: 'invoice.pdf',
  type: 'application/pdf'
});
const response = await api.post('/api/ai/document/process/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
// Save response.data.document_id for the chat!
```

### RAG Chat (Talk to Documents)
Ask questions based on the uploaded documents.
- **POST** `/api/ai/chat/` (Requires Auth)
- **Body:** 
```json
{
  "question": "How much did I spend on food?",
  "document_id": 1  // Optional: Restrict to a specific document
}
```
- **Response (200):** 
```json
{
  "answer": "You spent ₹4,500 on food.",
  "sources": [{"document_name": "invoice.pdf", "preview": "...", "relevance_score": 0.92}]
}
```

---

## 💰 5. Transactions & Core Features

### Transactions
- **GET** `/api/transactions/` — List all user transactions.
- **POST** `/api/transactions/` — Create a manual transaction (`{"amount": 100, "category": "Food", "type": "expense"}`)
- **GET** `/api/transactions/summary/` — Get income/expense totals.

### Savings Goals
- **GET** `/api/goals/` — List all savings goals.
- **POST** `/api/goals/` — Create a goal (`{"title": "Car", "target_amount": 50000, "current_amount": 0, "deadline": "2026-12-31"}`).

### Wallet Management
- **GET** `/api/ai/wallet/` — Get current wallet balance.
- **POST** `/api/ai/wallet/add-money/` — Deposit virtual funds.

### Financial Health Score
- **GET** `/api/ai/financial-health/score/` — Get a dynamic AI-calculated health score (0-100).
- **GET** `/api/ai/financial-health/breakdown/` — Detailed breakdown (savings rate, debt ratio, etc.).
- **POST** `/api/ai/financial-health/recalculate/` — Force AI to update the score.

---

## 🎮 6. Gamification

- **GET** `/api/gamification/challenges/` — List daily/weekly financial challenges.
- **GET** `/api/gamification/badges/` — List all unlockable badges.
- **GET** `/api/gamification/summary/` — Get user points and current level.

---

## 🛠️ 7. Troubleshooting Frontend Issues

1. **Network Error / Connection Refused:**
   If using an Android emulator, `localhost` refers to the Android device itself. You MUST use `10.0.2.2:8000` to reach the Django server running on your computer.
2. **401 Unauthorized:**
   Ensure your Axios interceptor is correctly retrieving the JWT token and attaching `Bearer <token>` to the `Authorization` header.
3. **FormData Uploads Failing:**
   React Native's `FormData` requires the file object to have exactly `uri`, `name`, and `type` properties. Do not stringify the body.
