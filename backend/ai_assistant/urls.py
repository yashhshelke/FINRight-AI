# ai_assistant/urls.py
from django.urls import path
from .views import (
    ChatAPIView,
    GlobalChatHistoryAPIView,
    ChatMessageListAPIView,
    ChatSessionListAPIView,
    DocumentProcessAPIView,
    DocumentListAPIView,
    DocumentContentAPIView,
    ExpenseDocumentSummaryAPIView,
    ExpenseSuggestionAPIView,
    SimulationAPIView,
    CreditAnalysisAPIView,
    LoanListCreateAPIView,
    SpendingAnalysisAPIView,
    GoalPlanAnalysisAPIView,
    GoalIncomeSimulationAPIView,
    BudgetAdviceAPIView,
    FinancialToolAPIView,
    FinexaIntelligenceAPIView,
    GoalInvestmentPlanAPIView,
    SubscriptionHunterAPIView,
    MoneyReplayAPIView,
    KnowledgeBaseSearchAPIView,
    DailyBriefingAPIView,
)
from .financial_health_views import (
    get_current_score,
    get_score_history,
    get_score_breakdown,
    recalculate_score,
    get_recommendations,
)

urlpatterns = [
    # Upload + extract text + store SQL + store structured Mongo + generate summary
    path("document/process/", DocumentProcessAPIView.as_view(), name="document-process"),

    # Document management (SQL)
    path("documents/", DocumentListAPIView.as_view(), name="document-list"),
    path("documents/<int:document_id>/content/", DocumentContentAPIView.as_view(), name="document-content"),

    # Summary and breakdown from Mongo + LLM
    path("expense-document/<str:doc_id>/summary/", ExpenseDocumentSummaryAPIView.as_view(), name="expense-document-summary"),
    path("expense-document/<str:mongo_id>/suggestions/", ExpenseSuggestionAPIView.as_view(), name="expense-document-suggestions"),

    # RAG Chat endpoint
    path("chat/", ChatAPIView.as_view(), name="ai-chat"),
    path("chat/history/", GlobalChatHistoryAPIView.as_view(), name="ai-chat-history"),

    path("chat-sessions/", ChatSessionListAPIView.as_view(), name="chat-session-list"),
    path("chat-sessions/<int:session_id>/messages/", ChatMessageListAPIView.as_view(), name="chat-message-list"),

    # Financial Health Score endpoints
    path("financial-health/score/", get_current_score, name="financial-health-score"),
    path("financial-health/history/", get_score_history, name="financial-health-history"),
    path("financial-health/breakdown/", get_score_breakdown, name="financial-health-breakdown"),
    path("financial-health/recalculate/", recalculate_score, name="financial-health-recalculate"),
    path("financial-health/recommendations/", get_recommendations, name="financial-health-recommendations"),

    # AI Simulation & Analysis
    path("simulate/", SimulationAPIView.as_view(), name="ai-simulate"),
    path("credit-analysis/", CreditAnalysisAPIView.as_view(), name="ai-credit-analysis"),
    path("loans/", LoanListCreateAPIView.as_view(), name="ai-loans"),
    path("spending-analysis/", SpendingAnalysisAPIView.as_view(), name="ai-spending-analysis"),

    # AI Goal Planner
    path("goal-plan/", GoalPlanAnalysisAPIView.as_view(), name="ai-goal-plan"),
    path("goal-planner/", GoalPlanAnalysisAPIView.as_view(), name="ai-goal-planner"),
    path("goal-plan/simulate/", GoalIncomeSimulationAPIView.as_view(), name="ai-goal-simulate"),

    # Budget Advice
    path("budget-advice/", BudgetAdviceAPIView.as_view(), name="ai-budget-advice"),

    # Structured assistant and tool router
    path("tools/", FinancialToolAPIView.as_view(), name="ai-financial-tools"),
    path("intelligence/", FinexaIntelligenceAPIView.as_view(), name="ai-finexa-intelligence"),
    path("goal-investment/", GoalInvestmentPlanAPIView.as_view(), name="ai-goal-investment"),
    path("subscription-hunter/", SubscriptionHunterAPIView.as_view(), name="ai-subscription-hunter"),
    path("money-replay/", MoneyReplayAPIView.as_view(), name="ai-money-replay"),
    path("knowledge/search/", KnowledgeBaseSearchAPIView.as_view(), name="ai-knowledge-search"),
    path("daily-briefing/", DailyBriefingAPIView.as_view(), name="ai-daily-briefing"),
]
