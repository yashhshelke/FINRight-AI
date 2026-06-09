"""Money Replay story generator.

Produces a shareable month-end story with slide-like sections derived from
backend financial facts.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from ai_assistant.services.financial_engine import build_money_replay


def _parse_month_value(month: Optional[str]):
    if not month:
        return None
    try:
        return datetime.fromisoformat(month)
    except Exception:
        return None


def generate_money_replay(user, month: Optional[str] = None) -> Dict[str, Any]:
    return build_money_replay(user, month_value=_parse_month_value(month))