# ai_assistant/services/spending_insights.py
"""
Unified spending analysis and insights service.

Replaces:
  • expense_summary.py   — summarised totals from uploaded document data
  • spending_analysis.py — pattern/anomaly/recommendation analysis from SQL transactions

Design rationale
────────────────
Both files aggregated expense data to produce user-facing insights, but
operated on different inputs:
  • Document data  : structured dict extracted from a PDF via LLM (Mongo)
  • Transaction data: live SQL Transaction objects (Django ORM)

They are merged here because:
  1. The aggregation math is identical (totals, category sums, top items)
  2. The output shapes are complementary and callers often need both
  3. Keeping them separate forced callers to import from two places

Public API
──────────
  summarize_document_expenses(data)   → summary dict for an uploaded PDF
  analyze_user_spending(user)         → pattern/anomaly/reco dict from SQL
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import timedelta
from typing import Dict, List, Optional

from django.utils import timezone

logger = logging.getLogger(__name__)


# ── Shared aggregation helper ────────────────────────────────────────────────

def _aggregate_expense_rows(rows: List[dict]) -> dict:
    """
    Aggregate a list of expense dicts (each with 'amount', 'category',
    'merchant') into totals and breakdowns.

    Returns:
        {
            total_amount:   float,
            record_count:   int,
            category_spend: {category: float},
            merchant_spend: {merchant: float},
        }
    """
    total = 0.0
    cat_spend: Dict[str, float] = defaultdict(float)
    merch_spend: Dict[str, float] = defaultdict(float)

    for row in rows:
        try:
            amt = float(row.get("amount") or 0)
        except (ValueError, TypeError):
            amt = 0.0

        total += amt
        cat_spend[row.get("category") or "General"] += amt
        merch_spend[row.get("merchant") or "Unknown"] += amt

    return {
        "total_amount": round(total, 2),
        "record_count": len(rows),
        "category_spend": dict(cat_spend),
        "merchant_spend": dict(merch_spend),
    }


def _top_items(mapping: Dict[str, float], n: int = 3) -> List[str]:
    """Return the top-n keys sorted by value descending."""
    return [k for k, _ in sorted(mapping.items(), key=lambda x: x[1], reverse=True)[:n]]


# ── 1. Document-level summary (from Mongo extracted_data) ───────────────────

def summarize_document_expenses(data: dict) -> dict:
    """
    Produce a financial summary from structured expense data extracted from
    an uploaded PDF/image document.

    Args:
        data: Decrypted ``extracted_data`` dict from MongoDB, containing at
              minimum an ``"expenses"`` list of ``{item, amount, category,
              merchant}`` records.

    Returns:
        {
            total_amount:       float,
            record_count:       int,
            biggest_category:   str,
            top_merchants:      [str, ...],
            currency:           str,
            suggestions:        [str, ...],
        }
    """
    expenses: List[dict] = data.get("expenses") or []
    agg = _aggregate_expense_rows(expenses)

    biggest_category = (
        max(agg["category_spend"], key=agg["category_spend"].__getitem__)
        if agg["category_spend"] else "None"
    )
    top_merchants = _top_items(agg["merchant_spend"], n=3)

    # Deterministic suggestions — no LLM call needed here
    suggestions: List[str] = []
    if biggest_category != "None":
        suggestions.append(
            f"Most of your spending went to {biggest_category}. "
            "Consider setting a budget limit here."
        )
    if agg["total_amount"] > 0:
        suggestions.append(
            "Tracking these expenses regularly will help maintain your financial health."
        )

    return {
        "total_amount": agg["total_amount"],
        "record_count": agg["record_count"],
        "biggest_category": biggest_category,
        "top_merchants": top_merchants,
        "currency": data.get("currency", "INR"),
        "suggestions": suggestions,
    }


# ── 2. Live transaction analysis (from SQL Transaction objects) ──────────────

def analyze_user_spending(user) -> dict:
    """
    Analyse a user's transaction history from the SQL database to surface
    patterns, anomalies, and actionable recommendations.

    Uses the last 30 days of transactions; falls back to all-time data if
    no recent activity exists.  The result is cached in ``SpendingPattern``
    so repeated calls within 24 hours return the cached version
    (caching is handled by the calling view, not here).

    Args:
        user: Authenticated Django user instance.

    Returns:
        {
            period:          str,
            total_spent:     float,
            by_category:     [{category, amount, pct}, ...],
            patterns:        [str, ...],
            anomalies:       [str, ...],
            recommendations: [{title, description, potential_savings}, ...],
        }
    """
    from transactions.models import Transaction
    from ai_assistant.models import SpendingPattern

    # ── 1. Fetch transactions ────────────────────────────────────────────────
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_txns = list(Transaction.objects.filter(user=user, date__gte=thirty_days_ago))

    if recent_txns:
        txns = recent_txns
        period_label = "Last 30 Days"
    else:
        txns = list(Transaction.objects.filter(user=user))
        period_label = "All Time"

    if not txns:
        result = {
            "period": period_label,
            "total_spent": 0.0,
            "by_category": [],
            "patterns": ["No activity detected yet."],
            "anomalies": [],
            "recommendations": [
                {
                    "title": "Start Tracking",
                    "description": "Log your expenses to get personalised insights.",
                    "potential_savings": "₹0",
                }
            ],
        }
        _cache_pattern(user, result)
        return result

    # ── 2. Aggregate expense transactions ───────────────────────────────────
    expense_rows = [
        {"amount": float(t.amount or 0), "category": t.category or "Other", "merchant": ""}
        for t in txns if t.type == "expense"
    ]

    if not expense_rows:
        result = {
            "period": period_label,
            "total_spent": 0.0,
            "by_category": [],
            "patterns": [f"No expense transactions found in {period_label.lower()}."],
            "anomalies": [],
            "recommendations": [
                {
                    "title": "Track Expenses",
                    "description": "Log more expense transactions to get insights.",
                    "potential_savings": "₹0",
                }
            ],
        }
        _cache_pattern(user, result)
        return result

    agg = _aggregate_expense_rows(expense_rows)
    total = agg["total_amount"]
    cat_spend = agg["category_spend"]

    # ── 3. Build by_category breakdown ──────────────────────────────────────
    by_category = [
        {
            "category": cat,
            "amount": round(amt, 2),
            "pct": round((amt / total) * 100) if total else 0,
        }
        for cat, amt in sorted(cat_spend.items(), key=lambda x: x[1], reverse=True)
    ]

    top_cat = by_category[0]["category"] if by_category else "General"
    top_amt = by_category[0]["amount"] if by_category else 0.0
    top_pct = by_category[0]["pct"] if by_category else 0

    # ── 4. Patterns ──────────────────────────────────────────────────────────
    patterns = [
        f"You made {len(expense_rows)} expense transactions in "
        f"{period_label.lower()} totalling ₹{total:,.0f}.",
        f"Your highest spending category is {top_cat} "
        f"(₹{top_amt:,.0f}, {top_pct}% of total expenses).",
    ]

    # ── 5. Anomalies ─────────────────────────────────────────────────────────
    anomalies: List[str] = []
    if top_pct > 60:
        anomalies.append(
            f"Unusually high concentration of spending in {top_cat} "
            f"({top_pct}% of total). Consider diversifying or capping this category."
        )
    # Flag any single transaction > 40% of total spend
    for t in txns:
        if t.type == "expense":
            amt = float(t.amount or 0)
            if total and (amt / total) > 0.4:
                anomalies.append(
                    f"A single {t.category} transaction of ₹{amt:,.0f} on "
                    f"{t.date.strftime('%d %b')} accounts for over 40% of your spend."
                )
                break  # report only the largest outlier

    # ── 6. Recommendations ───────────────────────────────────────────────────
    recommendations: List[dict] = []
    DISCRETIONARY = {"Food", "Dining", "Entertainment", "Shopping", "Restaurants"}

    if top_cat in DISCRETIONARY:
        savings = round(top_amt * 0.20, 2)
        recommendations.append({
            "title": f"Trim {top_cat} Spend",
            "description": (
                f"Cutting your {top_cat} expenses by 20% could free up "
                f"₹{savings:,.0f} per month for savings or investments."
            ),
            "potential_savings": f"₹{savings:,.0f}",
        })
    else:
        savings = round(total * 0.10, 2)
        recommendations.append({
            "title": "Reduce Discretionary Spend",
            "description": (
                "Reducing overall discretionary expenses by 10% can meaningfully "
                "improve your savings rate."
            ),
            "potential_savings": f"₹{savings:,.0f}",
        })

    # Add a savings-rate tip if spending is high relative to recent income
    income = float(getattr(user, "income", None) or 0)
    if income > 0 and total > income * 0.8:
        recommendations.append({
            "title": "Savings Rate Alert",
            "description": (
                f"Your spending (₹{total:,.0f}) is above 80% of your stated "
                f"monthly income (₹{income:,.0f}). Aim to save at least 20%."
            ),
            "potential_savings": f"₹{round(income * 0.20):,.0f}",
        })

    result = {
        "period": period_label,
        "total_spent": total,
        "by_category": by_category,
        "patterns": patterns,
        "anomalies": anomalies,
        "recommendations": recommendations,
    }

    _cache_pattern(user, result)
    return result


def _cache_pattern(user, result: dict) -> None:
    """Persist analysis result to SpendingPattern (silent on failure)."""
    try:
        from ai_assistant.models import SpendingPattern
        SpendingPattern.objects.create(user=user, analysis_data=result)
    except Exception as exc:
        logger.warning("Could not cache spending pattern for user %s: %s", user.id, exc)


# ── Backward-compatibility shims ─────────────────────────────────────────────
# Old names kept so any code not yet updated to the new import path
# continues to work without modification.

def summarize_expenses_from_data(data: dict) -> dict:
    """Deprecated alias — use summarize_document_expenses() instead."""
    return summarize_document_expenses(data)
