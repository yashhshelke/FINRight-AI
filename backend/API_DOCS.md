# Finexa AI — React Native Integration Guide & API Documentation

This document serves as the complete technical reference for connecting a **React Native (Expo or CLI)** frontend to the Finexa AI Django Backend.

---

## 🏗️ 1. Architecture Overview

- **Backend Framework:** Django 5.2 + Django REST Framework
- **Databases:** PostgreSQL (Neon) for relational data, MongoDB (Atlas) for unstructured AI data.
- **Authentication:** JWT (JSON Web Tokens) via `djangorestframework-simplejwt`.
- **RAG Chatbot:** Text chunks stored in Postgres, queried via OpenRouter/OpenAI. PII is scrubbed before leaving the server.
- **WebSocket:** Async Channels used for real-time streaming of AI responses.
- **Base URL (Local):** `http://10.0.2.2:8000` (Android Emulator) or `http://localhost:8000` (iOS Simulator).
- **Base URL (Production):** *Your deployed domain URL*

---

## 🚀 2. React Native Setup & Best Practices

### Recommended Libraries
To interact with this backend smoothly, we recommend:
- `axios`: For making HTTP requests.
- `expo-secure-store` or `@react-native-async-storage/async-storage`: To securely store JWT tokens.
- `react-native-document-picker` or `expo-document-picker`: For uploading invoices.
- `react-native-websocket` or standard `WebSocket` API for real-time RAG chat.

### Axios Interceptor Setup
You must attach the JWT token to every protected request. Create an Axios instance that handles this automatically, and properly handles our new **Rate Limits (429)** and **Credit Limits (402)**.

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      alert("You're making too many requests. Please slow down.");
    } else if (error.response?.status === 402) {
      alert("Insufficient AI credits. Please upgrade your plan.");
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔐 3. Authentication Endpoints

Base path: `/auth/`

### Register
Create a new user.
- **POST** `/auth/register/`
- **Body:** `{"email": "test@finexa.ai", "full_name": "John Doe", "password": "...", "password_confirm": "..."}`
- **Response (201):** Returns `user` object and `tokens` (access, refresh).

### Login
- **POST** `/auth/login/`
- **Body:** `{"email": "test@finexa.ai", "password": "..."}`
- **Response (200):** `{"access": "...", "refresh": "..."}`
- **Frontend Action:** Save both tokens to SecureStore.

### Get Current User Profile
- **GET** `/auth/me/` (Requires Auth)
- **Response (200):** User profile data (balance, tier, credits, etc.)

---

## 🤖 4. AI Assistant & RAG Chatbot

Base path: `/api/ai/`

### Process Document (Invoice/Receipt Upload)
Uploads a document, extracts text, chunks it, embeds it in Postgres, and generates an expense summary via LLM.
- **POST** `/api/ai/document/process/` (Requires Auth, **Costs 5 Credits**)
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
// Save response.data.document_id to filter chats later!
```

### RAG Chat (Real-time WebSockets)
To provide a ChatGPT-like streaming experience, connect to the WebSocket endpoint.
- **URL:** `ws://10.0.2.2:8000/ws/ai/chat/?token=<YOUR_JWT_ACCESS_TOKEN>`
- **Cost:** **2 Credits per question.**

**Client Example:**
```javascript
const ws = new WebSocket(`ws://10.0.2.2:8000/ws/ai/chat/?token=${accessToken}`);

// Send a question
ws.send(JSON.stringify({
  question: "How much did I spend on food?",
  document_id: 1 // Optional. Omit to search all documents.
}));

// Listen for streaming tokens
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "typing" && data.status === "start") {
    // Show loading spinner
  } else if (data.type === "token") {
    // Append data.text to the UI
  } else if (data.type === "done") {
    // Hide spinner, response complete
  } else if (data.type === "error") {
    // Handle error (e.g., Insufficient Credits)
  }
};
```

---

## 💰 5. Transactions & Core Features

### Transactions
- **GET** `/api/transactions/` — List all user transactions. (Paginated, 20 per page).
- **POST** `/api/transactions/` — Create a manual transaction (`{"amount": 100, "category": "Food", "type": "expense"}`).

### Savings Goals
- **GET** `/api/goals/` — List all savings goals.
- **POST** `/api/goals/` — Create a goal (`{"title": "Car", "target_amount": 50000, "current_amount": 0, "deadline": "2026-12-31"}`).

### Financial Health Score
- **GET** `/api/ai/financial-health/score/` — Get a dynamic AI-calculated health score (0-100).
- **GET** `/api/ai/financial-health/breakdown/` — Detailed breakdown (savings rate, debt ratio, etc.).
- **POST** `/api/ai/financial-health/recalculate/` — Force AI to update the score.

---

## 🛡️ 6. Security & Infrastructure Notes

1. **Rate Limiting:** If you send too many requests quickly, you will receive a `429 Too Many Requests` error. Implement exponential backoff or debouncing on your UI inputs.
2. **Audit Logs:** All financial and AI API calls are strictly logged on the backend.
3. **PII Masking:** Your users' sensitive data (SSN, Emails, Phone numbers) found in uploaded documents are automatically masked before being sent to the AI.

---

## 🎮 7. Gamification

- **GET** `/api/gamification/challenges/` — List daily/weekly financial challenges.
- **GET** `/api/gamification/badges/` — List all unlockable badges.

---

## 🛠️ 8. Troubleshooting Frontend Issues

1. **Network Error / Connection Refused:**
   If using an Android emulator, `localhost` refers to the Android device itself. You MUST use `10.0.2.2:8000` to reach the Django server running on your computer.
2. **401 Unauthorized:**
   Ensure your Axios interceptor is correctly retrieving the JWT token and attaching `Bearer <token>` to the `Authorization` header.
3. **FormData Uploads Failing:**
   React Native's `FormData` requires the file object to have exactly `uri`, `name`, and `type` properties. Do not stringify the body.
4. **Interactive API Docs:**
   You can view the full Swagger UI Interactive Docs in your browser at `http://localhost:8000/api/schema/swagger-ui/`.
