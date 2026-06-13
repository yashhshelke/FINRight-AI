"""
Django settings for Finexa AI.

Supports:
  - Local dev:   SQLite + InMemoryChannelLayer  (no extra env vars needed)
  - Production:  PostgreSQL (Neon.tech) + Redis (Upstash) via DATABASE_URL / REDIS_URL
"""

from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

# ── Paths ──────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# ── Security ───────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-@ldr)%no1*u!axh!_wqw#ki8!d#tbs1ht(&&)a-hu%ko2y1)mk")
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

# ── Installed apps ─────────────────────────────────────────────
INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "ai_assistant",
    "corsheaders",
    "rest_framework",
    "drf_spectacular",             # OpenAPI schema generation
    "users",
    "transactions",
    "savings_goals",
    "gamification",
    "sockets",
    "channels",
    "reports",
]

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",   # static files in prod
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "core.middleware.AuditLoggingMiddleware",
]

_CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "")
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in _CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]
ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

ASGI_APPLICATION = "core.asgi.application"

# ── Database ───────────────────────────────────────────────────
# PostgreSQL (Neon.tech) in production — set DATABASE_URL in .env
# Falls back to SQLite for local development automatically.
_DB_URL = os.getenv("DATABASE_URL")
if _DB_URL:
    import dj_database_url as _dj_db
    DATABASES = {
        "default": _dj_db.config(
            default=_DB_URL,
            conn_max_age=600,
            ssl_require=os.getenv("DB_SSL_REQUIRE", "True") == "True",
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# ── Password validation ────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── Internationalisation ───────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ── Static files ───────────────────────────────────────────────
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "False") == "True"
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "True" if not DEBUG else "False") == "True"
CSRF_COOKIE_SECURE = os.getenv("CSRF_COOKIE_SECURE", "True" if not DEBUG else "False") == "True"
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "31536000" if not DEBUG else "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv("SECURE_HSTS_INCLUDE_SUBDOMAINS", "True") == "True"
SECURE_HSTS_PRELOAD = os.getenv("SECURE_HSTS_PRELOAD", "False") == "True"
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# ── Environment variables ──────────────────────────────────────
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-nano-9b-v2:free")
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "")
OPENROUTER_APP_NAME = os.getenv("OPENROUTER_APP_NAME", "")
OPENAI_DIRECT_API_KEY = os.getenv("OPENAI_DIRECT_API_KEY") or os.getenv("OPENAI_API_KEY")
OPENAI_DIRECT_BASE_URL = os.getenv("OPENAI_DIRECT_BASE_URL", "https://api.openai.com/v1")
OPENAI_DIRECT_MODEL = os.getenv("OPENAI_DIRECT_MODEL", "gpt-4.1-mini")

# LLM routing: openrouter | openai | auto
LLM_DEFAULT_ROUTE = os.getenv("LLM_DEFAULT_ROUTE", "openrouter")
LLM_PROVIDER_ORDER = os.getenv("LLM_PROVIDER_ORDER", "openrouter,openai")

AUTH_USER_MODEL = "users.User"

# ── MongoDB (Atlas M0 — free) ──────────────────────────────────
MONGODB_URI = os.getenv("MONGO_URI")
MONGODB_DB_NAME = os.getenv("MONGO_DBNAME", "finexa")
MONGODB_COLLECTION_NAME = "expenses"

# ── RAG / Embedding settings ───────────────────────────────────
# Embeddings always use direct OpenAI (text-embedding-3-small).
# Falls back to local sentence-transformers when OPENAI_DIRECT_API_KEY is absent.
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "384"))   # 384 for local model; 1536 for OpenAI
RAG_CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "800"))
RAG_CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "150"))
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "5"))

# ── Field-level encryption (AES-256 via Fernet) ────────────────
FIELD_ENCRYPTION_KEY = os.getenv(
    "FIELD_ENCRYPTION_KEY",
    "KlNRKySijzVwzn6saAQZBMtZm35I0h5Zrg6s3DrW0-A=",  # replace in production!
)

# ── Django Channels — Redis (Upstash) in prod, in-memory locally ──
# Set REDIS_URL=rediss://default:<password>@<host>:<port> in .env for production
_REDIS_URL = os.getenv("REDIS_URL")
if _REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [_REDIS_URL],
            },
        }
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }

    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", _REDIS_URL or os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", CELERY_BROKER_URL)
    CELERY_ACCEPT_CONTENT = ["json"]
    CELERY_TASK_SERIALIZER = "json"
    CELERY_RESULT_SERIALIZER = "json"
    CELERY_TIMEZONE = TIME_ZONE
    CELERY_TASK_ALWAYS_EAGER = os.getenv("CELERY_TASK_ALWAYS_EAGER", "False") == "True"
# ── Cache backend ─────────────────────────────────────────────
# Uses Redis (Upstash) in production when REDIS_URL is set.
# Falls back to in-process LocMemCache for local development.
# The health score cache, savings cache, and spending-analysis cache all
# use this backend — so they actually survive across requests in prod.
if _REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": _REDIS_URL,
            "KEY_PREFIX": "finexa",
            "TIMEOUT": 3600,          # default TTL: 1 hour
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "finexa-local",
        }
    }

import sys
if 'test' in sys.argv:
    CACHES['default'] = {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }

# ── REST Framework ─────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    # ── Pagination ───────────────────────────────────────────
    # StandardResultsSetPagination (page_size=20, up to 100) is the global default.
    # Individual views can override with ChatMessageCursorPagination etc.
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 20,
    # ── Throttling ───────────────────────────────────────────
    # Scoped throttles are applied per-view (see core/throttles.py).
    # Global fallback limits protect against bulk scraping.
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # ── Global fallback scopes ────────────────────────────
        "anon": "60/hour",           # Public endpoints (IP-based)
        "user": "500/hour",          # General authenticated endpoints
        # ── Named scopes for expensive endpoints ──────────────
        "llm":             "30/hour",  # /chat/ and /intelligence/
        "document_upload": "5/hour",   # /document/process/
        "simulation":      "20/hour",  # /simulate/ and /credit-analysis/
        "goal_plan":       "10/hour",  # /goal-plan/?refresh=true
        "burst_anon":      "20/hour",  # /register/, /login/, /forgot-password/
    },
    # ── Schema (drf-spectacular) ─────────────────────────────
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

import sys
if 'test' in sys.argv:
    REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []


# ── JWT ────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUDIENCE": None,
    "ISSUER": None,
    "JTI_CLAIM": "jti",
    "TOKEN_TYPE_CLAIM": "token_type",
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",
    "JTI_DECODE_HANDLER": "rest_framework_simplejwt.utils.decode_handler",
}

# ── Email (SMTP) ───────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@finexa.ai")

EMAIL_VERIFICATION_EXPIRY_HOURS = 24
PASSWORD_RESET_EXPIRY_HOURS = 1

# ── Logging (Audit Trail) ──────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'audit': {
            'format': '{asctime} {levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'audit_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'security_audit.log',
            'maxBytes': 1024 * 1024 * 5,  # 5 MB
            'backupCount': 5,
            'formatter': 'audit',
        },
    },
    'loggers': {
        'security_audit': {
            'handlers': ['audit_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
