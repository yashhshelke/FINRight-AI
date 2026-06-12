# core/throttles.py
"""
Custom DRF throttle classes for Finexa AI — MVP 1000-user protection.

Scope names map to DEFAULT_THROTTLE_RATES in settings.py.

Usage on a view:
    from core.throttles import LLMRateThrottle
    class MyView(APIView):
        throttle_classes = [LLMRateThrottle]
"""
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class LLMRateThrottle(UserRateThrottle):
    """
    Protects LLM-heavy endpoints:
      POST /api/ai/chat/
      POST /api/ai/intelligence/

    Limit: 30 requests per hour per authenticated user.
    This keeps OpenRouter API costs bounded at ~30 LLM calls/user/hour.
    """
    scope = "llm"


class DocumentUploadThrottle(UserRateThrottle):
    """
    Protects the document processing pipeline:
      POST /api/ai/document/process/

    Limit: 5 uploads per hour per user.
    Each upload costs 5 credits + runs LLM extraction — prevents runaway credit burn.
    """
    scope = "document_upload"


class SimulationThrottle(UserRateThrottle):
    """
    Protects simulation and credit-analysis endpoints:
      POST /api/ai/simulate/
      POST /api/ai/credit-analysis/

    Limit: 20 requests per hour per user.
    """
    scope = "simulation"


class GoalPlanThrottle(UserRateThrottle):
    """
    Protects the LLM-backed goal plan endpoint:
      GET /api/ai/goal-plan/?refresh=true

    Limit: 10 refreshes per hour per user (refresh=false hits cache, not LLM).
    """
    scope = "goal_plan"


class BurstAnonThrottle(AnonRateThrottle):
    """
    Stricter anonymous throttle for public auth endpoints
    (register, login, forgot-password) to prevent brute-force / credential stuffing.

    Limit: 20 requests per hour per IP.
    """
    scope = "burst_anon"
