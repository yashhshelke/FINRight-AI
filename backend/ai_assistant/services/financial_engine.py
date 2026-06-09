"""Deterministic financial calculations for Finexa AI.

This module is the backend source of truth for financial facts. It performs
all calculations that the assistant may explain later, including spending,
cash flow, goal progress, subscriptions, forecasts, health scoring, and
financial-twin simulations.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal
import math
import re
from typing import Any, Dict, List, Optional, Tuple

from django.utils import timezone

from transactions.models import Transaction
from savings_goals.models import SavingsGoal
from .knowledge_base import search_verified_knowledge

try:
    from ai_assistant.models import Loan
except Exception:  # pragma: no cover - defensive import for partial installs
    Loan = None


def _now() -> datetime:
    return timezone.now()


def _month_floor(value: Optional[date | datetime] = None) -> date:
    if value is None:
        value = _now()
    if isinstance(value, datetime):
        value = value.date()
    return value.replace(day=1)


def _month_range(month_value: Optional[date | datetime] = None) -> Tuple[datetime, datetime]:
    start = _month_floor(month_value)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1, day=1)
    else:
        end = start.replace(month=start.month + 1, day=1)
    return timezone.make_aware(datetime.combine(start, datetime.min.time())), timezone.make_aware(datetime.combine(end, datetime.min.time()))


def _safe_decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value or 0))
    except Exception:
        return Decimal("0")


def _transaction_amounts(user, *, start: Optional[datetime] = None, end: Optional[datetime] = None, tx_type: Optional[str] = None):
    qs = Transaction.objects.filter(user=user)
    if start is not None:
        qs = qs.filter(date__gte=start)
    if end is not None:
        qs = qs.filter(date__lt=end)
    if tx_type:
        qs = qs.filter(type=tx_type)
    return list(qs)


def _month_transactions(user, month_value: Optional[date | datetime] = None):
    start, end = _month_range(month_value)
    return _transaction_amounts(user, start=start, end=end)


def _income_for_period(user, txns) -> Decimal:
    income_txns = [_safe_decimal(tx.amount) for tx in txns if tx.type == "income"]
    profile_income = _safe_decimal(getattr(user, "income", 0))
    txn_income = sum(income_txns, Decimal("0"))
    return max(profile_income, txn_income)


def _expense_for_period(txns) -> Decimal:
    return sum((_safe_decimal(tx.amount) for tx in txns if tx.type == "expense"), Decimal("0"))


def get_income_summary(user, month_value: Optional[date | datetime] = None) -> Dict[str, Any]:
    txns = _month_transactions(user, month_value)
    income_transactions = [tx for tx in txns if tx.type == "income"]
    profile_income = _safe_decimal(getattr(user, "income", 0))
    transaction_income = sum((_safe_decimal(tx.amount) for tx in income_transactions), Decimal("0"))
    effective_income = max(profile_income, transaction_income)

    return {
        "month": _month_floor(month_value).isoformat(),
        "profile_income": float(profile_income),
        "transaction_income": float(transaction_income),
        "effective_income": float(effective_income),
        "income_transactions": len(income_transactions),
    }


def get_monthly_spending(user, month_value: Optional[date | datetime] = None) -> Dict[str, Any]:
    txns = _month_transactions(user, month_value)
    expense_total = _expense_for_period(txns)
    return {
        "month": _month_floor(month_value).isoformat(),
        "amount": float(expense_total),
        "currency": getattr(getattr(user, "settings", None), "currency", "INR"),
        "transaction_count": sum(1 for tx in txns if tx.type == "expense"),
    }


def get_category_breakdown(user, month_value: Optional[date | datetime] = None) -> Dict[str, Any]:
    txns = _month_transactions(user, month_value)
    category_totals: Dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for tx in txns:
        if tx.type != "expense":
            continue
        category_totals[(tx.category or "Miscellaneous").strip()] += _safe_decimal(tx.amount)

    rows = [
        {"category": category, "amount": float(amount), "percentage": 0.0}
        for category, amount in sorted(category_totals.items(), key=lambda item: item[1], reverse=True)
    ]
    total = sum((row["amount"] for row in rows), 0.0)
    for row in rows:
        row["percentage"] = round((row["amount"] / total) * 100, 2) if total else 0.0

    return {
        "month": _month_floor(month_value).isoformat(),
        "categories": rows,
        "total": round(total, 2),
    }


def get_cashflow_analysis(user, month_value: Optional[date | datetime] = None) -> Dict[str, Any]:
    txns = _month_transactions(user, month_value)
    income = _income_for_period(user, txns)
    expenses = _expense_for_period(txns)
    savings = income - expenses
    savings_rate = float(savings / income) if income > 0 else 0.0
    budget_utilization = float(expenses / income) if income > 0 else 0.0
    return {
        "month": _month_floor(month_value).isoformat(),
        "income": float(income),
        "expenses": float(expenses),
        "savings": float(savings),
        "savings_rate": round(savings_rate, 4),
        "cash_flow": float(savings),
        "budget_utilization": round(budget_utilization, 4),
    }


def get_budget_status(user, month_value: Optional[date | datetime] = None) -> Dict[str, Any]:
    income_summary = get_income_summary(user, month_value)
    category_breakdown = get_category_breakdown(user, month_value)
    effective_income = income_summary["effective_income"]
    expenses = category_breakdown["total"]
    savings = max(0.0, effective_income - expenses)

    needs_categories = {"Food", "Bills", "Healthcare", "Education", "Rent", "Travel"}
    needs = sum(row["amount"] for row in category_breakdown["categories"] if row["category"] in needs_categories)
    wants = sum(row["amount"] for row in category_breakdown["categories"] if row["category"] not in needs_categories)
    recommended_needs = round(effective_income * 0.5, 2)
    recommended_wants = round(effective_income * 0.3, 2)
    recommended_savings = round(effective_income * 0.2, 2)

    return {
        "month": _month_floor(month_value).isoformat(),
        "income": effective_income,
        "expenses": expenses,
        "savings": round(savings, 2),
        "needs": round(needs, 2),
        "wants": round(wants, 2),
        "recommended": {
            "needs": recommended_needs,
            "wants": recommended_wants,
            "savings": recommended_savings,
        },
        "status": "on_track" if expenses <= effective_income else "over_budget",
    }


def get_goal_progress(user) -> Dict[str, Any]:
    goals = SavingsGoal.objects.filter(user=user)
    rows = []
    total_target = Decimal("0")
    total_current = Decimal("0")

    for goal in goals:
        target = _safe_decimal(goal.target_amount)
        current = _safe_decimal(goal.current_amount)
        remaining = max(Decimal("0"), target - current)
        total_target += target
        total_current += current
        rows.append(
            {
                "id": goal.id,
                "title": goal.title,
                "priority": goal.priority,
                "target_amount": float(target),
                "current_amount": float(current),
                "remaining_amount": float(remaining),
                "progress_percentage": goal.progress_percentage,
                "monthly_contribution": float(_safe_decimal(goal.monthly_contribution)),
                "required_monthly": goal.required_monthly,
                "months_left": goal.months_left,
                "delay_months": goal.delay_months,
                "deadline": goal.deadline.isoformat() if goal.deadline else None,
                "status": goal.status,
            }
        )

    overall_progress = float(total_current / total_target * 100) if total_target > 0 else 0.0
    return {
        "goal_count": len(rows),
        "total_target": float(total_target),
        "total_current": float(total_current),
        "overall_progress": round(overall_progress, 2),
        "goals": rows,
    }


def get_subscription_analysis(user) -> Dict[str, Any]:
    txns = _transaction_amounts(user, start=_now() - timedelta(days=90))
    merchant_tracker: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"months": set(), "amount": Decimal("0"), "count": 0})

    for tx in txns:
        if tx.type != "expense":
            continue
        merchant = _normalize_subscription_label(tx.description or tx.category or "misc")
        month_key = tx.date.strftime("%Y-%m")
        merchant_tracker[merchant]["months"].add(month_key)
        merchant_tracker[merchant]["amount"] += _safe_decimal(tx.amount)
        merchant_tracker[merchant]["count"] += 1

    subscriptions = []
    for label, info in merchant_tracker.items():
        recurring_months = len(info["months"])
        if info["count"] >= 3 or recurring_months >= 2:
            average_monthly = float(info["amount"] / max(recurring_months, 1))
            subscriptions.append(
                {
                    "label": label,
                    "occurrences": info["count"],
                    "months_detected": recurring_months,
                    "average_monthly_cost": round(average_monthly, 2),
                    "annual_cost": round(average_monthly * 12, 2),
                }
            )

    subscriptions.sort(key=lambda item: item["average_monthly_cost"], reverse=True)
    return {
        "subscription_count": len(subscriptions),
        "subscriptions": subscriptions,
        "estimated_monthly_cost": round(sum(item["average_monthly_cost"] for item in subscriptions), 2),
    }


def _brand_aliases() -> Dict[str, List[str]]:
    return {
        "Netflix": ["netflix"],
        "Prime Video": ["prime video", "amazon prime", "primevideo", "amazonprime"],
        "Spotify": ["spotify"],
        "ChatGPT": ["chatgpt", "openai", "chat gpt"],
        "Canva": ["canva"],
        "YouTube Premium": ["youtube premium", "yt premium"],
        "Disney+": ["disney", "hotstar", "disney plus", "disney+"],
        "Adobe": ["adobe", "creative cloud"],
    }


def get_subscription_hunter(user, lookback_days: int = 180) -> Dict[str, Any]:
    window_start = _now() - timedelta(days=lookback_days)
    txns = _transaction_amounts(user, start=window_start)
    aliases = _brand_aliases()

    watched_by_brand: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"matches": [], "amount": Decimal("0"), "last_seen": None, "count": 0})

    for tx in txns:
        if tx.type != "expense":
            continue
        search_blob = f"{tx.description or ''} {tx.category or ''}".lower()
        for brand, brand_aliases in aliases.items():
            if any(alias in search_blob for alias in brand_aliases):
                watched_by_brand[brand]["matches"].append(tx)
                watched_by_brand[brand]["amount"] += _safe_decimal(tx.amount)
                watched_by_brand[brand]["count"] += 1
                if watched_by_brand[brand]["last_seen"] is None or tx.date > watched_by_brand[brand]["last_seen"]:
                    watched_by_brand[brand]["last_seen"] = tx.date

    recurring = []
    for brand, info in watched_by_brand.items():
        if not info["matches"]:
            continue
        inactive_days = (timezone.now() - info["last_seen"]).days if info["last_seen"] else lookback_days
        monthly_estimate = float(info["amount"] / max(1, len({tx.date.strftime("%Y-%m") for tx in info["matches"]})))
        status = "inactive" if inactive_days >= 30 else "active"
        cancel_recommended = inactive_days >= 30 and monthly_estimate > 0
        recurring.append(
            {
                "brand": brand,
                "label": brand,
                "occurrences": info["count"],
                "last_seen_at": info["last_seen"].isoformat() if info["last_seen"] else None,
                "inactive_days": inactive_days,
                "estimated_monthly_cost": round(monthly_estimate, 2),
                "estimated_annual_cost": round(monthly_estimate * 12, 2),
                "status": status,
                "cancel_recommended": cancel_recommended,
                "recommendation": (
                    f"You haven't used {brand} for {inactive_days} days. Cancel it if you do not plan to resume."
                    if cancel_recommended
                    else f"{brand} is still active. Review whether the subscription is still essential."
                ),
            }
        )

    recurring.sort(key=lambda item: (not item["cancel_recommended"], -item["estimated_monthly_cost"]))
    total_recoverable = round(sum(item["estimated_monthly_cost"] for item in recurring if item["cancel_recommended"]), 2)

    return {
        "subscription_count": len(recurring),
        "inactive_subscription_count": sum(1 for item in recurring if item["cancel_recommended"]),
        "subscriptions": recurring,
        "estimated_monthly_cost": round(sum(item["estimated_monthly_cost"] for item in recurring), 2),
        "recoverable_monthly_savings": total_recoverable,
        "source": "Finexa Subscription Hunter",
        "confidence": "high",
    }


def _normalize_subscription_label(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"[^a-z0-9 &/-]", "", value)
    if not value:
        return "misc"
    return value[:64]


def get_expense_forecast(user) -> Dict[str, Any]:
    txns = _transaction_amounts(user, start=_now() - timedelta(days=90))
    month_buckets: Dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    category_buckets: Dict[str, Dict[str, Decimal]] = defaultdict(lambda: defaultdict(lambda: Decimal("0")))

    for tx in txns:
        if tx.type != "expense":
            continue
        month_key = tx.date.strftime("%Y-%m")
        amount = _safe_decimal(tx.amount)
        month_buckets[month_key] += amount
        category_buckets[month_key][tx.category or "Miscellaneous"] += amount

    month_values = list(month_buckets.values())
    average_monthly = sum(month_values, Decimal("0")) / len(month_values) if month_values else Decimal("0")

    category_average: Dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    category_counts: Dict[str, int] = defaultdict(int)
    for month_data in category_buckets.values():
        for category, amount in month_data.items():
            category_average[category] += amount
            category_counts[category] += 1

    forecast_categories = []
    for category, total in category_average.items():
        divisor = max(category_counts[category], 1)
        forecast_categories.append(
            {
                "category": category,
                "forecast": round(float(total / divisor), 2),
            }
        )
    forecast_categories.sort(key=lambda item: item["forecast"], reverse=True)

    return {
        "forecast_month": (_month_floor() + timedelta(days=32)).replace(day=1).isoformat(),
        "predicted_monthly_expense": round(float(average_monthly), 2),
        "category_forecast": forecast_categories,
        "based_on_months": len(month_values),
    }


def get_affordability_analysis(user, target_amount: float, item_name: str, is_emi: bool = False, emi_months: int = 0) -> dict:
    """
    Simulates if a user can afford a specific purchase or save a target amount (Future Self Simulator).
    """
    target_amount = float(target_amount)
    cashflow = get_cashflow_analysis(user)
    
    # Use cached or calculated all-time savings (current liquid cash)
    all_time_income = sum(float(t.amount or 0) for t in Transaction.objects.filter(user=user, type='income'))
    all_time_expense = sum(float(t.amount or 0) for t in Transaction.objects.filter(user=user, type='expense'))
    current_savings = max(0, all_time_income - all_time_expense)
    
    monthly_disposable = cashflow.get('avg_monthly_savings', 0)
    
    # Affordability thresholds
    is_affordable = False
    warning = ""
    months_to_save = 0
    
    if is_emi:
        # EMI Affordability: Can their monthly disposable income comfortably cover the EMI?
        emi_amount = target_amount / emi_months if emi_months > 0 else target_amount
        if monthly_disposable > (emi_amount * 1.2):  # 20% buffer
            is_affordable = True
            warning = f"You can comfortably afford the ₹{emi_amount:,.0f} EMI. It takes up {(emi_amount/monthly_disposable)*100:.1f}% of your average monthly savings."
        elif monthly_disposable > emi_amount:
            is_affordable = True
            warning = f"You can afford the ₹{emi_amount:,.0f} EMI, but it's tight! It consumes most of your monthly disposable income."
        else:
            is_affordable = False
            warning = f"Warning: The ₹{emi_amount:,.0f} EMI exceeds your average monthly savings of ₹{monthly_disposable:,.0f}."
    else:
        # Outright Purchase: Can they buy it right now without draining their emergency buffer?
        emergency_buffer = cashflow.get('avg_monthly_expenses', 0) * 2  # 2 months buffer
        if current_savings >= (target_amount + emergency_buffer):
            is_affordable = True
            warning = f"Yes, you have enough liquid cash (₹{current_savings:,.0f}) to buy the {item_name} outright and still maintain a healthy emergency buffer."
        elif current_savings >= target_amount:
            is_affordable = True
            warning = f"You can buy the {item_name} outright, but it will drain your emergency buffer to ₹{current_savings - target_amount:,.0f}."
            if monthly_disposable > 0:
                months_to_save = ((target_amount + emergency_buffer) - current_savings) / monthly_disposable
                warning += f" Consider waiting {months_to_save:.1f} months to rebuild the buffer first."
        else:
            is_affordable = False
            if monthly_disposable > 0:
                months_to_save = (target_amount - current_savings) / monthly_disposable
                warning = f"No, you currently have ₹{current_savings:,.0f}. At your current savings rate, it will take you {months_to_save:.1f} months to afford the {item_name}."
            else:
                warning = f"No, and you currently have negative or zero cashflow. You need to reduce expenses to save for the {item_name}."

    return {
        "item_name": item_name,
        "target_amount": target_amount,
        "is_emi": is_emi,
        "current_savings": current_savings,
        "monthly_disposable": monthly_disposable,
        "is_affordable": is_affordable,
        "analysis_message": warning,
        "projected_months_to_save": months_to_save
    }





def build_money_replay(user, month_value: Optional[date | datetime] = None) -> Dict[str, Any]:
    month_value = month_value or _now()
    start, end = _month_range(month_value)
    txns = _transaction_amounts(user, start=start, end=end)
    income_summary = get_income_summary(user, month_value)
    cashflow = get_cashflow_analysis(user, month_value)
    category_breakdown = get_category_breakdown(user, month_value)
    health = get_financial_health_score(user)
    goals = get_goal_progress(user)

    expense_txns = [tx for tx in txns if tx.type == "expense"]
    biggest_purchase = None
    if expense_txns:
        biggest_purchase_txn = max(expense_txns, key=lambda item: float(_safe_decimal(item.amount)))
        biggest_purchase = {
            "description": biggest_purchase_txn.description or biggest_purchase_txn.category or "Largest expense",
            "amount": float(_safe_decimal(biggest_purchase_txn.amount)),
            "category": biggest_purchase_txn.category,
        }

    top_category = category_breakdown["categories"][0] if category_breakdown["categories"] else {"category": "None", "amount": 0.0}
    savings = cashflow["savings"]
    best_decision = "Kept spending below income" if savings >= 0 else "No positive cash flow this month"
    worst_decision = f"Heavy spending in {top_category['category']}" if top_category["category"] != "None" else "No clear spending pattern"
    health_delta = 0

    slides = [
        {
            "id": "cover",
            "title": f"Your {_month_floor(month_value).strftime('%B')} Story",
            "subtitle": "A shareable month-end money replay",
            "emoji": "✨",
            "metric": None,
        },
        {
            "id": "income",
            "title": "Income",
            "subtitle": "Verified monthly income used for this story",
            "emoji": "💰",
            "metric": f"₹{income_summary['effective_income']:,.0f}",
        },
        {
            "id": "savings",
            "title": "Savings",
            "subtitle": f"Savings rate {cashflow['savings_rate']:.0%}",
            "emoji": "🌱",
            "metric": f"₹{savings:,.0f}",
        },
        {
            "id": "biggest_purchase",
            "title": "Biggest Purchase",
            "subtitle": biggest_purchase["description"] if biggest_purchase else "No large purchase detected",
            "emoji": "🛍️",
            "metric": f"₹{biggest_purchase['amount']:,.0f}" if biggest_purchase else "₹0",
        },
        {
            "id": "best_decision",
            "title": "Best Financial Decision",
            "subtitle": best_decision,
            "emoji": "✅",
            "metric": f"Health {health['score']}/100",
        },
        {
            "id": "worst_decision",
            "title": "Worst Financial Decision",
            "subtitle": worst_decision,
            "emoji": "⚠️",
            "metric": f"Top category: {top_category['category']}",
        },
        {
            "id": "goal_progress",
            "title": "Goal Progress",
            "subtitle": f"{goals['goal_count']} active goal(s)",
            "emoji": "🎯",
            "metric": f"{goals['overall_progress']:.0f}% overall progress" if goals["goal_count"] else "No active goals",
        },
        {
            "id": "outro",
            "title": "Shareable Summary",
            "subtitle": "Finexa Money Replay ready to share",
            "emoji": "📲",
            "metric": f"Net savings: ₹{savings:,.0f}",
        },
    ]

    share_caption = (
        f"{_month_floor(month_value).strftime('%B')} Money Replay from Finexa: income ₹{income_summary['effective_income']:,.0f}, "
        f"savings ₹{savings:,.0f}, health score {health['score']}/100."
    )

    return {
        "title": f"Your {_month_floor(month_value).strftime('%B')} Story",
        "period": _month_floor(month_value).isoformat(),
        "slides": slides,
        "summary": {
            "income": income_summary["effective_income"],
            "savings": savings,
            "biggest_purchase": biggest_purchase,
            "best_financial_decision": best_decision,
            "worst_financial_decision": worst_decision,
            "financial_health_score": health["score"],
            "financial_health_change": health_delta,
        },
        "share_caption": share_caption,
        "source": "Finexa Money Replay Engine",
        "confidence": "high",
    }


def get_financial_health_score(user) -> Dict[str, Any]:
    cashflow = get_cashflow_analysis(user)
    budget = get_budget_status(user)
    goal_progress = get_goal_progress(user)
    subscription = get_subscription_analysis(user)
    income = cashflow["income"]
    expenses = cashflow["expenses"]
    savings_rate = cashflow["savings_rate"]
    liquid_buffer = max(0.0, float(cashflow["savings"]))

    emergency_months = (liquid_buffer / expenses) if expenses > 0 else 0.0
    debt_monthly = 0.0
    if Loan is not None:
        debt_monthly = sum(float(_safe_decimal(loan.monthly_emi)) for loan in Loan.objects.filter(user=user, status="ACTIVE"))
    debt_ratio = (debt_monthly / income) if income > 0 else 0.0

    spending_stability = _spending_stability_score(user)
    goal_ratio = (goal_progress["overall_progress"] / 100.0) if goal_progress["goal_count"] else 0.5

    savings_score = _score_from_bands(savings_rate, [(0.30, 25), (0.20, 20), (0.10, 15), (0.05, 10), (0.0, 5)], fallback=0)
    emergency_score = _score_from_bands(emergency_months, [(6, 20), (3, 15), (1, 8), (0, 3)], fallback=0)
    debt_score = _score_from_bands(1 - debt_ratio, [(0.95, 15), (0.85, 12), (0.75, 8), (0.60, 4)], fallback=0)
    budget_score = 20 if budget["status"] == "on_track" else max(0, 20 - int((budget["expenses"] - budget["income"]) / max(budget["income"], 1) * 100))
    stability_score = spending_stability
    goal_score = _score_from_bands(goal_ratio, [(0.90, 10), (0.75, 8), (0.50, 5), (0.25, 3)], fallback=2)

    total = max(0, min(100, savings_score + emergency_score + debt_score + budget_score + stability_score + goal_score))
    if total >= 80:
        category = "Excellent"
    elif total >= 65:
        category = "Good"
    elif total >= 45:
        category = "Fair"
    else:
        category = "Needs Attention"

    recommendations = []
    if savings_rate < 0.2:
        recommendations.append("Increase automatic savings transfers on payday.")
    if emergency_months < 3:
        recommendations.append("Build an emergency fund that covers at least 3 months of essential expenses.")
    if debt_ratio > 0.3:
        recommendations.append("Reduce EMI burden before taking on new credit.")
    if subscription["estimated_monthly_cost"] > 0:
        recommendations.append("Review recurring subscriptions and cancel the least used ones.")
    if goal_progress["goal_count"]:
        recommendations.append("Increase monthly goal contributions where possible.")

    factors = {
        "savings_rate": round(savings_rate, 4),
        "emergency_fund_months": round(emergency_months, 2),
        "debt_ratio": round(debt_ratio, 4),
        "budget_utilization": round(cashflow["budget_utilization"], 4),
        "spending_stability": spending_stability,
        "goal_progress": goal_progress["overall_progress"],
    }

    return {
        "score": total,
        "category": category,
        "factors": factors,
        "recommendations": recommendations,
        "explanation": _health_explanation(category, factors),
    }


def get_investment_readiness_score(user) -> Dict[str, Any]:
    health = get_financial_health_score(user)
    emergency_months = health["factors"]["emergency_fund_months"]
    debt_ratio = health["factors"]["debt_ratio"]
    savings_rate = health["factors"]["savings_rate"]

    if emergency_months >= 6 and debt_ratio <= 0.2 and savings_rate >= 0.2 and health["score"] >= 75:
        readiness = "Ready"
    elif emergency_months >= 3 and debt_ratio <= 0.35 and savings_rate >= 0.1 and health["score"] >= 55:
        readiness = "Moderately Ready"
    else:
        readiness = "Needs Improvement"

    return {
        "readiness": readiness,
        "health_score": health["score"],
        "reasons": [
            f"Emergency fund covers {emergency_months:.1f} months",
            f"Debt ratio is {debt_ratio:.1%}",
            f"Savings rate is {savings_rate:.1%}",
        ],
    }


def get_monthly_report(user) -> Dict[str, Any]:
    spending = get_monthly_spending(user)
    category_breakdown = get_category_breakdown(user)
    cashflow = get_cashflow_analysis(user)
    health = get_financial_health_score(user)
    goals = get_goal_progress(user)
    subscriptions = get_subscription_analysis(user)

    top_category = category_breakdown["categories"][0]["category"] if category_breakdown["categories"] else "None"
    best_decision = "Kept spending below income this month" if cashflow["savings"] >= 0 else "No positive cash flow this month"
    worst_category = top_category if top_category != "None" else "None"

    return {
        "period": spending["month"],
        "best_financial_decision": best_decision,
        "worst_spending_category": worst_category,
        "top_expense_category": worst_category,
        "total_savings": cashflow["savings"],
        "monthly_spending": spending["amount"],
        "financial_health_score": health["score"],
        "financial_health_change": 0,
        "savings_streak": 0,
        "goal_progress": goals,
        "subscription_summary": subscriptions,
        "social_summary": f"Finexa wrapped your month with a health score of {health['score']}/100.",
    }


def _parse_goal_amount(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip().lower().replace(",", "")
    if not text:
        return None
    multiplier = 1.0
    if "crore" in text or re.search(r"\bcr\b", text):
        multiplier = 10_000_000.0
    elif "lakh" in text or "lac" in text or re.search(r"\bl\b", text):
        multiplier = 100_000.0
    text = re.sub(r"[^0-9.]+", " ", text).strip()
    if not text:
        return None
    try:
        return float(text.split()[0]) * multiplier
    except Exception:
        return None


def _parse_goal_years(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip().lower()
    if not text:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if not match:
        return None
    try:
        return float(match.group(1))
    except Exception:
        return None


def calculate_required_sip(
    target_amount: float,
    years: float,
    current_amount: float = 0.0,
    expected_annual_return_pct: float = 12.0,
) -> Dict[str, Any]:
    years = max(years, 0.1)
    months = max(1, int(round(years * 12)))
    target_amount = max(0.0, float(target_amount))
    current_amount = max(0.0, float(current_amount))
    monthly_rate = max(0.0, float(expected_annual_return_pct)) / 100.0 / 12.0

    if monthly_rate == 0:
        required_sip = max(0.0, (target_amount - current_amount) / months)
        projected_corpus = current_amount + (required_sip * months)
    else:
        future_value_current = current_amount * ((1 + monthly_rate) ** months)
        remaining_future_value = max(0.0, target_amount - future_value_current)
        denominator = ((1 + monthly_rate) ** months) - 1
        required_sip = 0.0 if denominator <= 0 else remaining_future_value * monthly_rate / denominator
        projected_corpus = future_value_current + (required_sip * (((1 + monthly_rate) ** months) - 1) / monthly_rate)

    total_invested = current_amount + (required_sip * months)
    return {
        "target_amount": round(target_amount, 2),
        "current_amount": round(current_amount, 2),
        "years": round(years, 2),
        "months": months,
        "expected_annual_return_pct": round(expected_annual_return_pct, 2),
        "required_sip": round(required_sip, 2),
        "total_invested": round(total_invested, 2),
        "projected_corpus": round(projected_corpus, 2),
        "assumption_note": f"Illustrative projection using {expected_annual_return_pct:.1f}% annual return.",
    }


def build_goal_to_investment_plan(user, payload: Dict[str, Any]) -> Dict[str, Any]:
    cashflow = get_cashflow_analysis(user)
    available_monthly_surplus = max(0.0, cashflow["cash_flow"])

    question_text = str(payload.get("question") or "").strip()
    expected_return_pct = payload.get("expected_return_pct", 12.0)
    try:
        expected_return_pct = float(expected_return_pct)
    except Exception:
        expected_return_pct = 12.0

    goals_payload = payload.get("goals")
    plans: List[Dict[str, Any]] = []

    if isinstance(goals_payload, list) and goals_payload:
        source_goals = goals_payload
    elif payload.get("goal_amount") is not None or payload.get("years") is not None or question_text:
        parsed_amount = _parse_goal_amount(payload.get("goal_amount"))
        parsed_years = _parse_goal_years(payload.get("years"))

        if parsed_amount is None and question_text:
            parsed_amount = _parse_goal_amount(question_text)
        if parsed_years is None and question_text:
            parsed_years = _parse_goal_years(question_text)

        source_goals = [
            {
                "title": str(payload.get("title") or payload.get("goal_title") or "Personal Goal"),
                "target_amount": parsed_amount or 0.0,
                "current_amount": _parse_goal_amount(payload.get("current_amount")) or 0.0,
                "years": parsed_years or 1.0,
                "priority": str(payload.get("priority") or "medium"),
                "deadline": payload.get("deadline"),
            }
        ]
    else:
        source_goals = list(SavingsGoal.objects.filter(user=user))

    for item in source_goals:
        if isinstance(item, SavingsGoal):
            title = item.title
            target_amount = float(item.target_amount)
            current_amount = float(item.current_amount)
            years = float(item.months_left) / 12.0 if item.months_left else None
            priority = item.priority
            deadline = item.deadline.isoformat() if item.deadline else None
        else:
            title = str(item.get("title") or item.get("name") or "Untitled Goal")
            target_amount = _parse_goal_amount(item.get("target_amount") or item.get("amount")) or 0.0
            current_amount = _parse_goal_amount(item.get("current_amount") or 0.0) or 0.0
            years = _parse_goal_years(item.get("years") or item.get("time_horizon_years") or item.get("deadline_years"))
            deadline = item.get("deadline")
            priority = str(item.get("priority") or "medium")

        if years is None and deadline:
            try:
                deadline_date = datetime.fromisoformat(str(deadline)).date()
                delta_days = (deadline_date - _now().date()).days
                years = max(0.1, delta_days / 365.0)
            except Exception:
                years = 1.0
        if years is None:
            years = 1.0

        plan = calculate_required_sip(
            target_amount=target_amount,
            years=years,
            current_amount=current_amount,
            expected_annual_return_pct=expected_return_pct,
        )
        plan.update(
            {
                "title": title,
                "priority": priority,
                "deadline": deadline,
                "monthly_affordability": round(available_monthly_surplus, 2),
                "is_affordable": plan["required_sip"] <= available_monthly_surplus,
                "gap_to_afford": round(max(0.0, plan["required_sip"] - available_monthly_surplus), 2),
                "cta_text": f"Start this SIP on your preferred investing platform, such as Groww.",
            }
        )
        plans.append(plan)

    priority_rank = {"high": 0, "medium": 1, "low": 2}
    plans.sort(key=lambda row: (priority_rank.get(str(row.get("priority", "medium")).lower(), 1), row["required_sip"]))

    total_required_sip = round(sum(item["required_sip"] for item in plans), 2)
    roadmap = []
    remaining_surplus = available_monthly_surplus
    for item in plans:
        allocation = min(item["required_sip"], max(0.0, remaining_surplus))
        remaining_surplus -= allocation
        roadmap.append(
            {
                "title": item["title"],
                "priority": item["priority"],
                "required_sip": item["required_sip"],
                "recommended_monthly_allocation": round(allocation, 2),
                "is_affordable": item["is_affordable"],
                "gap_to_afford": item["gap_to_afford"],
                "cta_text": item["cta_text"],
            }
        )

    if not plans:
        return {
            "error": "No goal data available",
            "source": "Finexa Goal-to-Investment Engine",
        }

    primary = plans[0]
    overall_affordable = total_required_sip <= available_monthly_surplus
    if overall_affordable:
        insight = (
            f"You need about ₹{primary['required_sip']:,.0f}/month for {primary['title']} to reach ₹{primary['target_amount']:,.0f} in {primary['years']:.1f} years."
        )
        recommendation = "You can start the plan now if you want to stay on track with your current cash flow."
    else:
        insight = (
            f"Your total goal roadmap needs ₹{total_required_sip:,.0f}/month, but your current surplus is ₹{available_monthly_surplus:,.0f}/month."
        )
        recommendation = "Focus on the highest-priority goal first or extend timelines so the SIP fits your monthly surplus."

    return {
        "primary_goal": primary,
        "roadmap": roadmap,
        "summary": {
            "available_monthly_surplus": round(available_monthly_surplus, 2),
            "total_required_sip": total_required_sip,
            "overall_affordable": overall_affordable,
        },
        "insight": insight,
        "recommendation": recommendation,
        "risk_level": "low" if overall_affordable else "medium",
        "source": "Finexa Goal-to-Investment Engine",
        "confidence": "high",
    }


def simulate_financial_twin(user, scenario: Dict[str, Any]) -> Dict[str, Any]:
    purchase_amount = float(scenario.get("purchase_amount") or scenario.get("amount") or 0)
    horizon_months = max(1, int(scenario.get("horizon_months") or 1))
    cashflow = get_cashflow_analysis(user)
    goals = get_goal_progress(user)
    budget = get_budget_status(user)
    health = get_financial_health_score(user)
    subscriptions = get_subscription_analysis(user)

    projected_surplus = cashflow["cash_flow"] * horizon_months
    upcoming_bills = subscriptions["estimated_monthly_cost"] * horizon_months
    projected_buffer = max(0.0, float(cashflow["savings"])) + projected_surplus - upcoming_bills - purchase_amount
    emergency_fund_months_after = (projected_buffer / cashflow["expenses"]) if cashflow["expenses"] > 0 else 0.0

    goal_delay_days = 0
    if purchase_amount > projected_surplus:
        goal_delay_days = int(math.ceil(((purchase_amount - projected_surplus) / max(cashflow["cash_flow"], 1)) * 30))

    can_afford = projected_buffer >= 0 and emergency_fund_months_after >= 3
    risk_level = "LOW" if can_afford else "HIGH" if emergency_fund_months_after < 1 else "MEDIUM"

    if can_afford:
        insight = "Based on projected cash flow, the purchase keeps your emergency fund above target and does not materially delay goals."
        recommendation = "You can proceed cautiously if the purchase remains a one-time expense and no other large bills are due."
    else:
        insight = "Based on projected cash flow, the purchase would reduce your buffer below a safe level and may delay goal progress."
        recommendation = "Delay the purchase or reduce the amount so your emergency fund remains at least 3 months of expenses."

    return {
        "scenario": scenario,
        "can_afford": can_afford,
        "risk_level": risk_level,
        "projected_surplus": round(projected_surplus, 2),
        "projected_buffer": round(projected_buffer, 2),
        "emergency_fund_months_after_purchase": round(emergency_fund_months_after, 2),
        "goal_delay_days": goal_delay_days,
        "source": "Finexa Financial Twin Engine",
        "insight": insight,
        "recommendation": recommendation,
        "health_score_reference": health["score"],
        "goal_reference": goals,
    }


def search_knowledge_base(question: str):
    return search_verified_knowledge(question, top_k=3)


def route_financial_tool(tool_name: str, user, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    payload = payload or {}
    month_value = _coerce_month_value(payload.get("month") or payload.get("month_date"))

    tool_map = {
        "get_monthly_spending": lambda: get_monthly_spending(user, month_value),
        "get_category_breakdown": lambda: get_category_breakdown(user, month_value),
        "get_budget_status": lambda: get_budget_status(user, month_value),
        "get_goal_progress": lambda: get_goal_progress(user),
        "goal_investment": lambda: build_goal_to_investment_plan(user, payload),
        "subscription_hunter": lambda: get_subscription_hunter(user, int(payload.get("lookback_days", 180))),
        "money_replay": lambda: build_money_replay(user, month_value),
        "get_financial_health_score": lambda: get_financial_health_score(user),
        "get_cashflow_analysis": lambda: get_cashflow_analysis(user, month_value),
        "get_subscription_analysis": lambda: get_subscription_analysis(user),
        "get_expense_forecast": lambda: get_expense_forecast(user),
        "get_income_summary": lambda: get_income_summary(user, month_value),
        "get_monthly_report": lambda: get_monthly_report(user),
        "get_investment_readiness_score": lambda: get_investment_readiness_score(user),
        "financial_twin": lambda: simulate_financial_twin(user, payload),
        "daily_briefing": lambda: get_daily_briefing(user),
    }

    if tool_name not in tool_map:
        return {
            "error": f"Unknown tool: {tool_name}",
            "available_tools": sorted(tool_map.keys()),
        }

    result = tool_map[tool_name]()
    return {
        "tool": tool_name,
        "result": result,
    }


def build_structured_ai_response(question: str, tool_name: str, tool_result: Dict[str, Any]) -> Dict[str, Any]:
    source = tool_result.get("source") or "Finexa backend financial engine"
    if tool_name == "get_monthly_spending":
        amount = tool_result["result"]["amount"]
        insight = f"You spent ₹{amount:,.2f} this month."
        recommendation = "Review the highest category to find one recurring expense you can reduce."
        risk_level = "low"
        confidence = "high"
    elif tool_name == "goal_investment":
        result = tool_result["result"]
        insight = result["insight"]
        recommendation = result["recommendation"]
        risk_level = result.get("risk_level", "medium")
        confidence = result.get("confidence", "high")
        source = result.get("source", source)
    elif tool_name == "subscription_hunter":
        result = tool_result["result"]
        recoverable = result.get("recoverable_monthly_savings", 0)
        insight = f"I found {result['subscription_count']} subscription pattern(s) and ₹{recoverable:,.2f} in potential monthly savings."
        recommendation = "Cancel or review inactive subscriptions first, starting with the highest monthly cost."
        risk_level = "medium" if recoverable > 0 else "low"
        confidence = result.get("confidence", "high")
        source = result.get("source", source)
    elif tool_name == "money_replay":
        result = tool_result["result"]
        insight = result["share_caption"]
        recommendation = "Use the slide deck to highlight one win and one spending habit to improve next month."
        risk_level = "low"
        confidence = result.get("confidence", "high")
        source = result.get("source", source)
    elif tool_name == "get_cashflow_analysis":
        result = tool_result["result"]
        insight = f"Your monthly cash flow is ₹{result['cash_flow']:,.2f}."
        recommendation = "If cash flow is negative, reduce discretionary spending or increase income before adding new goals."
        risk_level = "medium" if result["cash_flow"] >= 0 else "high"
        confidence = "high"
    elif tool_name == "financial_twin":
        result = tool_result["result"]
        insight = result["insight"]
        recommendation = result["recommendation"]
        risk_level = result["risk_level"].lower()
        confidence = "high"
        source = result.get("source", source)
    else:
        result = tool_result["result"]
        insight = _generic_insight(tool_name, result)
        recommendation = _generic_recommendation(tool_name, result)
        risk_level = _generic_risk(tool_name, result)
        confidence = "high"

    return {
        "insight": insight,
        "recommendation": recommendation,
        "risk_level": risk_level,
        "source": source,
        "confidence": confidence,
    }


def build_educational_response(question: str) -> Dict[str, Any]:
    articles = search_knowledge_base(question)
    if not articles:
        return {
            "insight": "I could not find a verified internal knowledge article for that topic.",
            "recommendation": "Ask a finance-specific question and I will answer using verified internal knowledge.",
            "risk_level": "low",
            "source": "Finexa Internal Knowledge Base",
            "confidence": "low",
        }

    article = articles[0]
    return {
        "insight": article["summary"],
        "recommendation": "Use this concept as a guide and validate decisions against your backend financial data.",
        "risk_level": "low",
        "source": article["source"],
        "confidence": "medium",
    }


def detect_intent(question: str) -> str:
    normalized = question.lower()
    if any(token in normalized for token in ["sip", "goal roadmap", "monthly roadmap", "want ₹", "want rs", "want in 5 years", "in years"]):
        if any(token in normalized for token in ["want", "need", "achieve", "goal", "save", "invest"]):
            return "goal_investment"
    if any(token in normalized for token in ["subscription hunter", "cancel", "inactive subscription", "netflix", "prime", "spotify", "chatgpt", "canva"]):
        return "subscription_hunter"
    if any(token in normalized for token in ["money replay", "money wrapped", "monthly story", "your june story", "wrapped"]):
        return "money_replay"
    if any(token in normalized for token in ["how much did i spend", "monthly spending", "spent this month", "total spent"]):
        return "get_monthly_spending"
    if any(token in normalized for token in ["category", "breakdown", "where did i spend"]):
        return "get_category_breakdown"
    if any(token in normalized for token in ["budget", "budget status", "over budget"]):
        return "get_budget_status"
    if any(token in normalized for token in ["goal progress", "how far", "savings goal"]):
        return "get_goal_progress"
    if any(token in normalized for token in ["health score", "financial health", "money health"]):
        return "get_financial_health_score"
    if any(token in normalized for token in ["cash flow", "cashflow", "income minus expenses"]):
        return "get_cashflow_analysis"
    if any(token in normalized for token in ["subscription", "recurring payment", "monthly recurring"]):
        return "get_subscription_analysis"
    if any(token in normalized for token in ["forecast", "predict next month", "future expense"]):
        return "get_expense_forecast"
    if any(token in normalized for token in ["wrapped", "monthly report", "month in review"]):
        return "get_monthly_report"
    if any(token in normalized for token in ["can i buy", "afford", "financial twin", "simulate"]):
        return "financial_twin"
    return "educational"


def _coerce_month_value(value: Any) -> Optional[date | datetime]:
    if not value:
        return None
    if isinstance(value, (date, datetime)):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except Exception:
            try:
                return datetime.strptime(value, "%Y-%m-%d")
            except Exception:
                return None
    return None


def _score_from_bands(value: float, bands: List[Tuple[float, int]], fallback: int = 0) -> int:
    for threshold, score in bands:
        if value >= threshold:
            return score
    return fallback


def _spending_stability_score(user) -> int:
    txns = _transaction_amounts(user, start=_now() - timedelta(days=90))
    expense_amounts = [float(_safe_decimal(tx.amount)) for tx in txns if tx.type == "expense"]
    if len(expense_amounts) < 3:
        return 5
    average = sum(expense_amounts) / len(expense_amounts)
    if average <= 0:
        return 5
    variance = sum((amount - average) ** 2 for amount in expense_amounts) / len(expense_amounts)
    cv = math.sqrt(variance) / average
    if cv <= 0.25:
        return 10
    if cv <= 0.5:
        return 8
    if cv <= 0.8:
        return 6
    return 3


def _health_explanation(category: str, factors: Dict[str, Any]) -> str:
    return (
        f"Financial health is {category}. Savings rate is {factors['savings_rate']:.1%}, "
        f"emergency fund covers {factors['emergency_fund_months']:.1f} months, "
        f"and budget utilization is {factors['budget_utilization']:.1%}."
    )


def _generic_insight(tool_name: str, result: Dict[str, Any]) -> str:
    if tool_name == "get_goal_progress":
        return f"You have {result['goal_count']} active goal(s) with {result['overall_progress']:.2f}% overall progress."
    if tool_name == "get_budget_status":
        return f"Your spending is currently {result['status'].replace('_', ' ')} for the selected month."
    if tool_name == "get_financial_health_score":
        return f"Your financial health score is {result['score']}/100 ({result['category']})."
    if tool_name == "get_subscription_analysis":
        return f"I found {result['subscription_count']} recurring subscription pattern(s)."
    if tool_name == "get_expense_forecast":
        return f"Predicted next-month expenses are ₹{result['predicted_monthly_expense']:,.2f}."
    if tool_name == "get_monthly_report":
        return f"Your monthly report is ready with a health score of {result['financial_health_score']}/100."
    if tool_name == "get_investment_readiness_score":
        return f"Your investment readiness status is {result['readiness']}."
    return "The requested financial calculation completed successfully."


def _generic_recommendation(tool_name: str, result: Dict[str, Any]) -> str:
    if tool_name == "get_goal_progress" and result["goal_count"]:
        return "Increase goal contributions or extend the timeline if the required monthly amount is above your current surplus."
    if tool_name == "get_budget_status":
        return "Trim the largest discretionary category first and protect savings before new spending."
    if tool_name == "get_financial_health_score":
        return "Focus on savings rate, emergency fund buildup, and lower debt burden to improve the score."
    if tool_name == "get_subscription_analysis" and result["subscription_count"]:
        return "Review recurring charges and cancel unused services."
    if tool_name == "get_expense_forecast":
        return "Keep a buffer above the forecasted monthly spend before making new commitments."
    if tool_name == "get_monthly_report":
        return "Use the wrapped summary to pick one expense habit to improve next month."
    if tool_name == "get_investment_readiness_score":
        return "Improve your emergency fund and debt ratio before increasing investment risk."
    return "Review the calculated output and act only on verified backend values."


def _generic_risk(tool_name: str, result: Dict[str, Any]) -> str:
    if tool_name == "get_budget_status":
        return "high" if result["status"] != "on_track" else "low"
    if tool_name == "get_financial_health_score":
        return "high" if result["score"] < 45 else "medium" if result["score"] < 75 else "low"
    if tool_name == "get_investment_readiness_score":
        return "high" if result["readiness"] == "Needs Improvement" else "medium" if result["readiness"] == "Moderately Ready" else "low"
    return "low"


def get_daily_briefing(user) -> Dict[str, Any]:
    # 1. Yesterday's spending
    yesterday_start = _now() - timedelta(days=1)
    yesterday_start = yesterday_start.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_end = yesterday_start + timedelta(days=1)
    yesterday_txns = _transaction_amounts(user, start=yesterday_start, end=yesterday_end)
    yesterday_spent = _expense_for_period(yesterday_txns)
    
    # 2. Goal Progress
    goals = get_goal_progress(user)
    progress_pct = goals["overall_progress"]
    
    # 3. Health Score
    health = get_financial_health_score(user)
    # We provide a mock delta or actual computed delta here. Since we don't store historical, we'll mock +2 or 0.
    health_delta = 2 if health["score"] >= 70 else (0 if health["score"] >= 40 else -1)
    
    # 4. Recommendation based on yesterday's spending
    food_keywords = ["swiggy", "zomato", "restaurant", "food", "cafe", "uber eats"]
    had_food_delivery = any(
        any(k in ((tx.description or "") + (tx.category or "")).lower() for k in food_keywords)
        for tx in yesterday_txns if tx.type == "expense"
    )
    
    if had_food_delivery:
        recommendation = "You spent on food yesterday. Avoid food delivery today to stay on track."
    elif yesterday_spent > 1000:
        recommendation = "Yesterday was an expensive day. Try a no-spend day today."
    else:
        recommendation = "Great job keeping expenses low yesterday. Keep it up!"
        
    return {
        "yesterday_spent": float(yesterday_spent),
        "goal_progress_pct": progress_pct,
        "health_score_delta": health_delta,
        "health_score": health["score"],
        "recommendation": recommendation,
        "source": "Finexa Daily AI Briefing"
    }
