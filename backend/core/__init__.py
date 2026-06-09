"""Core package."""

try:
	from .celery import app as celery_app
except Exception:  # pragma: no cover - Celery is optional during local checks
	celery_app = None

__all__ = ("celery_app",)
