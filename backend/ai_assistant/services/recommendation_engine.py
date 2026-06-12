# ai_assistant/services/recommendation_engine.py
"""
Recommendation engine — deterministic, rule-based spending recommendations.

Replaces:
  • expense_suggestions.py  (saving tips from document expense data)

NOT merged here:
  • goal_planning.py is intentionally kept separate. It owns LLM-powered
    goal feasibility analysis, income simulation, and GoalPlanAnalysis
    caching — all tightly coupled concerns that would be worse if split.
    The budget_suggestions field inside its output is produced by the LLM
    as part of a single structured JSON response, not a standalone function.

Design
──────
All functions here are deterministic (no LLM calls). They operate on plain
dicts or Django model instances and return structured recommendation lists
that can be composed by callers or rendered directly in the frontend.

Public API
──────────
  suggest_document_savings(expense_data)   → saving tips from PDF expense dict
  suggest_category_cuts(cat_spend, total)  → ranked cut suggestions from category map
  suggest_budget_allocation(income, cat_spend) → 50/30/20 gap analysis
"""

from __future__ import annotations

import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


# ── Shared constants ──────────────────────────────────────────────────────────

# Categories that are clearly discretionary and easiest to cut
_DINING = {"Food", "Dining", "Zomato", "Swiggy", "Restaurants", "Cafe"}
_SHOPPING = {"Shopping", "Amazon", "Flipkart", "Myntra", "Meesho", "Ecommerce"}
_ENTERTAINMENT = {"Entertainment", "Movies", "Netflix", "Hotstar", "Spotify", "OTT", "Gaming"}
_TRAVEL = {"Travel", "Uber", "Ola", "Rapido", "Cab", "Taxi"}
_NEEDS = {"Rent", "Utilities", "Bills", "Groceries", "Health", "Insurance",
          "Education", "Transportation", "Gas", "Household", "EMI", "Loan"}


# ── 1. Document-level saving suggestions ─────────────────────────────────────

def suggest_document_savings(expense_data: dict) -> dict:
    """
    Generate saving suggestions from structured expense data extracted from
    an uploaded PDF/image document.

    Rules are deterministic — no LLM call — so this is fast, free, and
    reliable even when the AI provider is rate-limited.

    Args:
        expense_data: Decrypted ``extracted_data`` dict from MongoDB,
                      containing an ``"expenses"`` list.

    Returns:
        {"suggestions": [str, ...]}   (max 4, ordered by impact)
    """
    expenses: List[dict] = expense_data.get("expenses") or []

    # Aggregate by category
    cat_spend: Dict[str, float] = {}
    total = 0.0
    for row in expenses:
        try:
            amt = float(row.get("amount") or 0)
        except (ValueError, TypeError):
            amt = 0.0
        cat = row.get("category") or "Other"
        cat_spend[cat] = cat_spend.get(cat, 0) + amt
        total += amt

    suggestions: List[str] = []

    for cat, spent in cat_spend.items():
        if cat in _DINING and spent > 2_000:
            save = round(spent * 0.30)
            suggestions.append(
                f"You spent ₹{spent:,.0f} on dining. Cooking at home 2 extra days "
                f"a week could save ₹{save:,.0f}/month."
            )
        elif cat in _SHOPPING and spent > 3_000:
            suggestions.append(
                f"You spent ₹{spent:,.0f} on shopping. A 48-hour cool-off rule "
                "before non-essential purchases cuts impulse buys significantly."
            )
        elif cat in _ENTERTAINMENT and spent > 1_000:
            save = round(spent * 0.40)
            suggestions.append(
                f"You spent ₹{spent:,.0f} on entertainment/subscriptions. "
                f"Auditing unused services could save ₹{save:,.0f}/month."
            )
        elif cat in _TRAVEL and spent > 2_500:
            save = round(spent * 0.25)
            suggestions.append(
                f"You spent ₹{spent:,.0f} on travel/cabs. Using public transport "
                f"or carpooling on short trips could save ₹{save:,.0f}/month."
            )

    # High concentration warning
    if total > 0 and cat_spend:
        top_cat = max(cat_spend, key=cat_spend.__getitem__)
        top_pct = round((cat_spend[top_cat] / total) * 100)
        if top_pct > 55 and top_cat not in _NEEDS:
            suggestions.insert(
                0,
                f"{top_cat} accounts for {top_pct}% of your total spend "
                f"(₹{cat_spend[top_cat]:,.0f}). Consider setting a monthly cap."
            )

    # Generic fallbacks
    if not suggestions:
        if expenses:
            suggestions = [
                "Track every expense to build financial awareness — "
                "what gets measured gets managed.",
                "Apply the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
            ]
        else:
            suggestions = ["Upload a bank statement or bill to get personalised saving tips."]

    return {"suggestions": suggestions[:4]}


# ── 2. Category-cut recommendations ──────────────────────────────────────────

def suggest_category_cuts(
    cat_spend: Dict[str, float],
    total_spend: float,
    top_n: int = 3,
) -> List[dict]:
    """
    Rank the top-N discretionary categories by spend and suggest a cut target.

    Useful for `SpendingAnalysisAPIView` or any view that already has
    aggregated category totals from SQL transactions.

    Args:
        cat_spend:   {category: total_amount} mapping
        total_spend: Overall total (used to compute percentages)
        top_n:       Maximum recommendations to return

    Returns:
        [
            {
                "category":         str,
                "spent":            float,
                "pct_of_total":     int,
                "cut_target_pct":   int,   # suggested reduction %
                "potential_saving": float,
                "tip":              str,
            },
            ...
        ]
    """
    if not cat_spend or total_spend <= 0:
        return []

    discretionary = {
        cat: amt for cat, amt in cat_spend.items()
        if cat not in _NEEDS and amt > 0
    }
    ranked = sorted(discretionary.items(), key=lambda x: x[1], reverse=True)

    results = []
    for cat, spent in ranked[:top_n]:
        pct = round((spent / total_spend) * 100)
        # Higher spend share → more aggressive cut target
        cut_pct = 30 if pct >= 30 else 20 if pct >= 15 else 10
        saving = round(spent * cut_pct / 100, 2)

        results.append({
            "category": cat,
            "spent": round(spent, 2),
            "pct_of_total": pct,
            "cut_target_pct": cut_pct,
            "potential_saving": saving,
            "tip": _cut_tip(cat, spent, cut_pct, saving),
        })

    return results


def _cut_tip(cat: str, spent: float, cut_pct: int, saving: float) -> str:
    """Return a human-readable tip for a specific category cut."""
    if cat in _DINING:
        return (
            f"Reduce dining out by {cut_pct}% — meal prep on weekends "
            f"could save ₹{saving:,.0f}/month."
        )
    if cat in _SHOPPING:
        return (
            f"Cut {cat} spending by {cut_pct}% using a 48-hour wishlist rule "
            f"before checkout — saves ₹{saving:,.0f}/month."
        )
    if cat in _ENTERTAINMENT:
        return (
            f"Audit {cat} subscriptions and cancel unused ones — "
            f"a {cut_pct}% cut saves ₹{saving:,.0f}/month."
        )
    if cat in _TRAVEL:
        return (
            f"Switch short-distance {cat} trips to public transport — "
            f"{cut_pct}% reduction saves ₹{saving:,.0f}/month."
        )
    return (
        f"Reducing {cat} by {cut_pct}% through conscious spending "
        f"could free up ₹{saving:,.0f}/month."
    )


# ── 3. 50/30/20 budget allocation gap analysis ────────────────────────────────

def suggest_budget_allocation(
    monthly_income: float,
    cat_spend: Dict[str, float],
) -> dict:
    """
    Compare actual spending to the 50/30/20 rule and surface specific gaps.

    Args:
        monthly_income: User's stated monthly income (INR)
        cat_spend:      {category: amount} from recent transactions

    Returns:
        {
            "income":         float,
            "needs_actual":   float,
            "wants_actual":   float,
            "savings_actual": float,
            "needs_ideal":    float,   # income × 0.50
            "wants_ideal":    float,   # income × 0.30
            "savings_ideal":  float,   # income × 0.20
            "gaps":           [{"area", "shortfall", "tip"}, ...],
            "status":         "on_track" | "needs_attention" | "critical",
        }
    """
    if monthly_income <= 0:
        return {"error": "Monthly income not set. Update your profile to get budget advice."}

    needs = sum(v for k, v in cat_spend.items() if k in _NEEDS)
    wants = sum(v for k, v in cat_spend.items() if k not in _NEEDS)
    total_spent = needs + wants
    savings = max(0.0, monthly_income - total_spent)

    needs_ideal = monthly_income * 0.50
    wants_ideal = monthly_income * 0.30
    savings_ideal = monthly_income * 0.20

    gaps = []

    if needs > needs_ideal:
        excess = round(needs - needs_ideal, 2)
        top_need = max(
            (k for k in cat_spend if k in _NEEDS), key=cat_spend.get, default="Bills"
        )
        gaps.append({
            "area": "Needs (50%)",
            "shortfall": excess,
            "tip": (
                f"Essential spending is ₹{excess:,.0f} over the 50% ideal. "
                f"Review {top_need} — it's your largest essential category."
            ),
        })

    if wants > wants_ideal:
        excess = round(wants - wants_ideal, 2)
        top_want = max(
            (k for k in cat_spend if k not in _NEEDS), key=cat_spend.get, default="Entertainment"
        )
        gaps.append({
            "area": "Wants (30%)",
            "shortfall": excess,
            "tip": (
                f"Discretionary spending is ₹{excess:,.0f} over 30%. "
                f"{top_want} is the biggest driver — consider a monthly cap."
            ),
        })

    if savings < savings_ideal:
        shortfall = round(savings_ideal - savings, 2)
        gaps.append({
            "area": "Savings (20%)",
            "shortfall": shortfall,
            "tip": (
                f"Savings are ₹{shortfall:,.0f} below the 20% target. "
                "Automate a transfer to savings on payday so it happens before you spend."
            ),
        })

    status = "on_track"
    if len(gaps) == 1:
        status = "needs_attention"
    elif len(gaps) >= 2:
        status = "critical"

    return {
        "income": monthly_income,
        "needs_actual": round(needs, 2),
        "wants_actual": round(wants, 2),
        "savings_actual": round(savings, 2),
        "needs_ideal": round(needs_ideal, 2),
        "wants_ideal": round(wants_ideal, 2),
        "savings_ideal": round(savings_ideal, 2),
        "gaps": gaps,
        "status": status,
    }


# ── Backward-compatibility shim ───────────────────────────────────────────────

def generate_saving_suggestions(expense_data: dict) -> dict:
    """Deprecated alias — use suggest_document_savings() instead."""
    return suggest_document_savings(expense_data)
