"Encrypted tenant-scoped credentials. Secrets never appear in read payloads or exports."

import json
import uuid

from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException
from sqlalchemy import select

from yiedu.auth import require_member
from yiedu.business_models import PlatformEvent, PrivateConnection
from yiedu.config import get_settings
from yiedu.models import User


def platform_admin(user):
    if not user.platform_admin:
        raise HTTPException(403, "Chỉ quản trị nền tảng / Platform administrator required")


def scope_access(scope, user, db, ai=False):
    if scope == "platform":
        platform_admin(user)
        return None
    try:
        tenant_id = uuid.UUID(scope.removeprefix("tenant:"))
        if scope != "tenant:" + str(tenant_id):
            raise ValueError("Non-canonical scope")
    except ValueError:
        raise HTTPException(404, "Scope not found") from None
    require_member(db, user, tenant_id, ["owner", "admin", "instructor"] if ai else ["owner"])
    return tenant_id


def cipher():
    try:
        return Fernet(get_settings().connections_encryption_key.get_secret_value().encode())
    except ValueError, TypeError:
        raise HTTPException(
            503,
            (
                "Cần cấu hình CONNECTIONS_ENCRYPTION_KEY trên máy chủ / Configure "
                "encryption key on server"
            ),
        ) from None


def seal(value):
    return cipher().encrypt(json.dumps(value).encode()).decode()


def unseal(value):
    if not value:
        return {}
    try:
        return json.loads(cipher().decrypt(value.encode()))
    except InvalidToken, ValueError:
        raise HTTPException(
            503, "Không đọc được kết nối; kiểm tra khóa mã hóa / Connection decryption failed"
        ) from None


def connection(db, scope, provider, lock=False):
    stmt = select(PrivateConnection).where(
        PrivateConnection.scope == scope, PrivateConnection.provider == provider
    )
    if lock:
        stmt = stmt.with_for_update().execution_options(populate_existing=True)
    return db.scalar(stmt)


def describe(row):
    return {
        "id": str(row.id),
        "provider": row.provider,
        "config": row.config,
        "enabled": row.enabled,
        "revision": row.revision,
        "has_secret": bool(row.encrypted_secret),
    }


def validate_connection(provider, config, secret, enabled):
    allowed = {
        "openai": ({"model", "daily_limit", "max_output_tokens"}, {"api_key"}),
        "paypal": ({"mode", "client_id", "merchant_id", "webhook_id"}, {"client_secret"}),
        "momo": ({"mode", "partner_code", "access_key"}, {"secret_key"}),
        "bank": ({"bank_name", "account_number", "account_name", "instructions"}, set()),
    }
    if provider not in allowed:
        raise HTTPException(404, "Provider not found")
    keys, secrets = allowed[provider]
    if set(config) - keys or set(secret) - secrets:
        raise HTTPException(422, "Unknown connection field")
    if any(not isinstance(v, (str, int)) or isinstance(v, bool) for v in config.values()):
        raise HTTPException(422, "Invalid connection configuration")
    if provider in {"paypal", "momo"} and config.get("mode", "sandbox") not in {"sandbox", "live"}:
        raise HTTPException(422, "Choose sandbox or live")
    if provider == "openai":
        config.setdefault("model", "gpt-4o-mini")
        config.setdefault("daily_limit", 20)
        config.setdefault("max_output_tokens", 12000)
        if not all(isinstance(config[k], int) for k in ["daily_limit", "max_output_tokens"]):
            raise HTTPException(422, "AI limits must be integers")
        if (
            not 1 <= int(config["daily_limit"]) <= 1000
            or not 1000 <= int(config["max_output_tokens"]) <= 24000
            or not str(config["model"]).replace("-", "").replace(".", "").isalnum()
        ):
            raise HTTPException(422, "Invalid AI limits/model")
    if enabled:
        required = {
            "openai": ["model"],
            "paypal": ["client_id", "merchant_id"],
            "momo": ["partner_code", "access_key"],
            "bank": ["bank_name", "account_number", "account_name"],
        }[provider]
        if any(not config.get(k) for k in required) or any(not secret.get(k) for k in secrets):
            raise HTTPException(422, "Điền đủ thông tin kết nối / Complete all connection fields")
    return config


def save_connection(db, scope, provider, payload, user):
    scope_access(scope, user, db)
    db.execute(select(User.id).where(User.id == user.id).with_for_update())
    row = connection(db, scope, provider, lock=True)
    if (row.revision if row else 0) != payload.revision:
        raise HTTPException(409, "Connection revision conflict")
    secret = {
        **(unseal(row.encrypted_secret) if row else {}),
        **{k: v for k, v in payload.secrets.items() if v},
    }
    config = validate_connection(provider, dict(payload.config), secret, payload.enabled)
    if row is None:
        row = PrivateConnection(scope=scope, provider=provider)
        db.add(row)
        row.revision = 0
    row.config = config
    row.encrypted_secret = seal(secret) if secret else ""
    row.enabled = payload.enabled
    row.revision += 1
    db.add(
        PlatformEvent(
            actor_id=user.id,
            action="connection.updated",
            detail={"scope": scope, "provider": provider, "enabled": row.enabled},
        )
    )
    db.commit()
    return describe(row)
