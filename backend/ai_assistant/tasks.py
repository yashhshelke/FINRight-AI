"""Celery tasks for Finexa AI assistant features."""

from __future__ import annotations

from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone

from .services.financial_engine import get_subscription_hunter, build_money_replay, build_goal_to_investment_plan
from .services.knowledge_base import get_verified_articles, seed_verified_articles
from reports.models import FinancialReport

User = get_user_model()


@shared_task
def refresh_subscription_hunter(user_id: int) -> dict:
    user = User.objects.get(id=user_id)
    return get_subscription_hunter(user)


@shared_task
def generate_money_replay_report(user_id: int, month: str | None = None) -> dict:
    user = User.objects.get(id=user_id)
    return build_money_replay(user)


@shared_task
def generate_goal_investment_plan(user_id: int, payload: dict) -> dict:
    user = User.objects.get(id=user_id)
    return build_goal_to_investment_plan(user, payload)


@shared_task
def nightly_financial_digest() -> dict:
    results = []
    for user in User.objects.filter(is_active=True):
        try:
            replay = build_money_replay(user)
            report = FinancialReport.objects.create(
                user=user,
                title=replay["title"],
                report_type="money_replay",
                data=replay,
            )
            results.append({"user_id": user.id, "report_id": report.id})
        except Exception:
            continue
    return {"generated": len(results), "items": results}


@shared_task
def sync_verified_knowledge_base() -> dict:
    articles = get_verified_articles()
    inserted = seed_verified_articles(articles)
    return {"seeded": inserted}
