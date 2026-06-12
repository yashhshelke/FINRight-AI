"""
URL configuration for Finexa AI backend.

Routes all application URLs including authentication, AI assistant,
transactions, savings goals, gamification, and reports endpoints.

Examples:
    - POST /auth/register         - User registration
    - POST /auth/login            - User login
    - GET  /auth/me               - Get current user profile (requires token)
    - POST /auth/refresh          - Refresh access token
    - POST /api/ai/document/process/ - Upload + extract + embed document
    - POST /api/ai/chat/          - RAG chat endpoint
    - GET  /api/documents/        - List documents
"""
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Authentication endpoints (JWT-based)
    path("auth/", include("users.urls")),

    # API endpoints
    path("api/ai/", include("ai_assistant.urls")),
    path("api/users/", include("users.urls")),
    path("api/transactions/", include("transactions.urls")),
    path("api/goals/", include("savings_goals.urls")),
    path("api/gamification/", include("gamification.urls")),
    path("api/reports/", include("reports.urls")),

    # ── OpenAPI / Swagger UI ──────────────────────────────────
    # Access during development:  http://localhost:8000/api/schema/swagger/
    # Download raw schema:        GET /api/schema/  (YAML or JSON)
    # ReDoc (read-only, clean):   http://localhost:8000/api/schema/redoc/
    path("api/schema/",         SpectacularAPIView.as_view(),          name="schema"),
    path("api/schema/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/schema/redoc/",   SpectacularRedocView.as_view(url_name="schema"),   name="redoc"),
]
