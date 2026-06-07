"""
core/encryption.py

Field-level AES-256 encryption using Fernet (cryptography library).

Custom Django model fields:
  - EncryptedTextField
  - EncryptedDecimalField
  - EncryptedJSONField

Standalone helpers:
  - encrypt_text(text) -> str
  - decrypt_text(cipher) -> str
  - encrypt_json(data) -> str
  - decrypt_json(cipher) -> dict/list
"""

import json
import base64
from decimal import Decimal
from cryptography.fernet import Fernet, InvalidToken

from django.conf import settings
from django.db import models


# ── Fernet singleton ────────────────────────────────────────────

def _get_fernet() -> Fernet:
    key = getattr(settings, "FIELD_ENCRYPTION_KEY", None)
    if not key:
        raise RuntimeError("FIELD_ENCRYPTION_KEY is not configured in settings.")
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)


# ── Low-level helpers ───────────────────────────────────────────

def encrypt_text(plaintext: str) -> str:
    """Encrypt a string and return a base64-encoded ciphertext string."""
    if not plaintext:
        return plaintext
    f = _get_fernet()
    return f.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_text(ciphertext: str) -> str:
    """Decrypt a Fernet-encrypted string."""
    if not ciphertext:
        return ciphertext
    try:
        f = _get_fernet()
        return f.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except (InvalidToken, Exception):
        # Return raw value if decryption fails (e.g., unencrypted legacy data)
        return ciphertext


def encrypt_json(data) -> str:
    """Serialize and encrypt a JSON-serialisable object."""
    return encrypt_text(json.dumps(data, ensure_ascii=False))


def decrypt_json(ciphertext: str):
    """Decrypt and deserialize a JSON-encrypted string."""
    raw = decrypt_text(ciphertext)
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return raw


# ── Custom model fields ─────────────────────────────────────────

class EncryptedTextField(models.TextField):
    """TextField that transparently encrypts/decrypts its value."""

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return decrypt_text(value)

    def to_python(self, value):
        if value is None:
            return value
        return decrypt_text(value)

    def get_prep_value(self, value):
        if value is None:
            return value
        return encrypt_text(str(value))


class EncryptedCharField(models.CharField):
    """CharField that transparently encrypts/decrypts its value."""

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return decrypt_text(value)

    def to_python(self, value):
        if value is None:
            return value
        return decrypt_text(value)

    def get_prep_value(self, value):
        if value is None:
            return value
        return encrypt_text(str(value))


class EncryptedDecimalField(models.DecimalField):
    """DecimalField that stores its value as an encrypted string in the DB."""

    def __init__(self, *args, **kwargs):
        # Store as TEXT under the hood
        self._original_max_digits = kwargs.get("max_digits", 12)
        self._original_decimal_places = kwargs.get("decimal_places", 2)
        super().__init__(*args, **kwargs)

    def db_type(self, connection):
        return "text"

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        decrypted = decrypt_text(str(value))
        try:
            return Decimal(decrypted)
        except Exception:
            return Decimal("0")

    def to_python(self, value):
        if value is None:
            return value
        if isinstance(value, Decimal):
            return value
        decrypted = decrypt_text(str(value))
        try:
            return Decimal(decrypted)
        except Exception:
            return Decimal("0")

    def get_prep_value(self, value):
        if value is None:
            return value
        return encrypt_text(str(value))


class EncryptedJSONField(models.TextField):
    """TextField that stores encrypted JSON."""

    def __init__(self, *args, **kwargs):
        self._default_factory = kwargs.pop("default", dict)
        super().__init__(*args, **kwargs)

    def from_db_value(self, value, expression, connection):
        if value is None:
            return self._default_factory() if callable(self._default_factory) else self._default_factory
        return decrypt_json(value)

    def to_python(self, value):
        if value is None:
            return self._default_factory() if callable(self._default_factory) else self._default_factory
        if isinstance(value, (dict, list)):
            return value
        return decrypt_json(value)

    def get_prep_value(self, value):
        if value is None:
            return None
        return encrypt_json(value)
