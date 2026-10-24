"""Bounded tenant snapshot and source bundle for local restore. No sessions or cloud secrets."""

import hashlib
import io
import json
import zipfile
from pathlib import Path

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy import select

from yiedu.models import (
    Completion,
    Course,
    Enrollment,
    LearningPath,
    Lesson,
    Membership,
    TenantExtension,
    User,
)


def snapshot(db, tenant):
    memberships = list(db.scalars(select(Membership).where(Membership.tenant_id == tenant.id)))
    user_ids = [m.user_id for m in memberships]
    data = {"schema_version": "0004", "tenant": row_data(tenant), "tables": {}}
    # Passwords are reset at the destination. No password hash or session token is exported.
    data["users"] = [
        {"id": str(u.id), "email": u.email, "name": u.name}
        for u in db.scalars(select(User).where(User.id.in_(user_ids)))
    ]
    for model in [
        Membership,
        Course,
        Lesson,
        LearningPath,
        Enrollment,
        Completion,
        TenantExtension,
    ]:
        rows = list(db.scalars(select(model).where(model.tenant_id == tenant.id).limit(10001)))
        if len(rows) > 10000:
            raise HTTPException(
                413, "Dữ liệu vượt giới hạn exporter local; cần triển khai export job"
            )
        data["tables"][model.__tablename__] = [row_data(row) for row in rows]
    return data


def row_data(row):
    return jsonable_encoder({c.name: getattr(row, c.name) for c in row.__table__.columns})


def create_export(db, tenant):
    data = json.dumps(snapshot(db, tenant), ensure_ascii=False, indent=2).encode()
    files = {"snapshot.json": data}
    root = Path(__file__).resolve().parents[2]
    # Explicit allowlist. No .env, git history, uploaded data or node_modules.
    for base in ["backend", "web", "scripts"]:
        for path in (root / base).rglob("*"):
            relative = path.relative_to(root)
            if path.is_file() and not any(
                p
                in {
                    "node_modules",
                    ".next",
                    "__pycache__",
                    "test-results",
                    "playwright-report",
                    ".expo",
                }
                for p in relative.parts
            ):
                if path.suffix in {
                    ".py",
                    ".json",
                    ".ts",
                    ".tsx",
                    ".css",
                    ".mjs",
                    ".mako",
                } or path.name in {"Dockerfile", ".dockerignore"}:
                    files[str(relative)] = path.read_bytes()
    for name in [
        "pyproject.toml",
        "requirements.lock",
        "alembic.ini",
        "Dockerfile",
        "compose.yaml",
        "compose.pg17.yaml",
        ".python-version",
        ".node-version",
        ".nvmrc",
    ]:
        files[name] = (root / name).read_bytes()
    files["RESTORE.md"] = (
        "# YiEdu standalone\n\n"
        "Source + tenant snapshot, not a signed production distribution.\n"
        "1. Create .env with DATABASE_URL, random ADMIN_API_KEY, INSTANCE_MODE=standalone.\n"
        "2. Install Python requirements and editable package; run alembic upgrade head.\n"
        "3. On a NEW empty database: python scripts/restore_snapshot.py snapshot.json\n"
        "4. The restore command generates new account passwords locally; store them safely.\n"
        "5. Start API on 8000; in web run npm ci, npm run dev.\n"
        "   API_INTERNAL_URL defaults localhost:8000.\n"
        "6. Homepage: /t/<slug>; admin: /t/<slug>/administrator.\n"
        "   Configure DNS/TLS separately.\n"
        "Video URLs are external references; no video files are managed by this release.\n"
        "OAuth/payment/update signing/mobile distribution require separate configuration.\n"
    ).encode()
    if sum(len(value) for value in files.values()) > 20_000_000:
        raise HTTPException(413, "Gói vượt giới hạn exporter local")
    manifest = {
        "tenant_id": str(tenant.id),
        "core_version": "0.5.0",
        "schema_version": "0004",
        "files": {name: hashlib.sha256(body).hexdigest() for name, body in files.items()},
        "signed": False,
        "passwords_reset_required": True,
    }
    files["export-manifest.json"] = json.dumps(manifest, indent=2).encode()
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, body in files.items():
            archive.writestr(name, body)
    return stream.getvalue()
