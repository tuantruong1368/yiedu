"""Opaque, revocable DB sessions. Web uses HttpOnly cookies; mobile uses Bearer tokens."""

import hashlib
import hmac
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from yiedu.config import get_settings
from yiedu.db import get_session
from yiedu.models import AuthSession, Membership, User

DB = Annotated[Session, Depends(get_session)]


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        method, salt, digest = stored.split("$")
        if method != "scrypt":
            return False
        check = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1)
        return hmac.compare_digest(check.hex(), digest)
    except ValueError, TypeError:
        return False


def digest_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def issue_session(db: Session, user: User, response: Response) -> str:
    token = secrets.token_urlsafe(48)
    db.add(
        AuthSession(
            token_hash=digest_token(token),
            user_id=user.id,
            expires_at=datetime.now(UTC) + timedelta(days=7),
        )
    )
    db.commit()
    response.set_cookie(
        "yiedu_session",
        token,
        httponly=True,
        secure=get_settings().cookie_secure,
        samesite="lax",
        max_age=604800,
        path="/",
    )
    return token


def current_user(request: Request, db: DB) -> User:
    header = request.headers.get("authorization", "")
    token = header[7:] if header.startswith("Bearer ") else request.cookies.get("yiedu_session")
    if not token:
        raise HTTPException(401, "Vui lòng đăng nhập")
    session = db.get(AuthSession, digest_token(token))
    if session is None or session.expires_at <= datetime.now(UTC):
        raise HTTPException(401, "Phiên đăng nhập không hợp lệ hoặc hết hạn")
    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(401, "Tài khoản không tồn tại")
    return user


UserDep = Annotated[User, Depends(current_user)]


def require_member(db: Session, user: User, tenant_id: uuid.UUID, roles=None) -> Membership:
    member = db.scalar(
        select(Membership).where(Membership.tenant_id == tenant_id, Membership.user_id == user.id)
    )
    if not member or (roles and member.role not in roles):
        raise HTTPException(403, "Bạn không có quyền truy cập hệ thống này")
    return member
