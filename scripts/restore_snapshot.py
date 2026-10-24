"""Restore an owner-exported snapshot into an empty migrated DB. Never extracts arbitrary ZIPs."""

import argparse
import json
import secrets
import uuid
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session
from yiedu.auth import hash_password
from yiedu.authoring import validate_site
from yiedu.config import get_settings
from yiedu.db import get_engine
from yiedu.models import (
    Completion,
    Course,
    Enrollment,
    LearningPath,
    Lesson,
    Membership,
    Tenant,
    TenantExtension,
    User,
    Workspace,
)
from yiedu.product_schemas import LessonWrite


def restore(data, db):
    if data.get("schema_version") not in {"0002", "0003", "0004"}:
        raise ValueError("Unsupported snapshot schema")
    if db.scalar(select(Tenant.id).limit(1)) or db.scalar(select(User.id).limit(1)):
        raise ValueError("Destination must be an empty migrated database")
    tenant_id = data["tenant"]["id"]
    users = {u["id"] for u in data["users"]}
    tables = data["tables"]
    course_ids = {x["id"] for x in tables["courses"]}
    lesson_ids = {x["id"] for x in tables["lessons"]}
    for rows in tables.values():
        for row in rows:
            if row["tenant_id"] != tenant_id:
                raise ValueError("Cross-tenant snapshot rejected")
            if "user_id" in row and row["user_id"] not in users:
                raise ValueError("Unknown snapshot user")
            if "course_id" in row and row["course_id"] not in course_ids:
                raise ValueError("Unknown snapshot course")
            if "lesson_id" in row and row["lesson_id"] not in lesson_ids:
                raise ValueError("Unknown snapshot lesson")
    for path in tables["learning_paths"]:
        if not set(path["course_ids"]).issubset(course_ids):
            raise ValueError("Unknown path course")
    page = data["tenant"].get("published_page", {})
    if page.get("schema_version") == "2.0":
        data["tenant"]["published_page"] = validate_site(page)
    for lesson in tables["lessons"]:
        fields = {
            k: lesson[k]
            for k in ["title", "content", "video_url", "position", "document", "translations"]
            if k in lesson
        }
        LessonWrite.model_validate(fields)
    credentials = []
    db.add(Tenant(**convert(data["tenant"])))
    db.flush()
    for user in data["users"]:
        password = secrets.token_urlsafe(18)
        db.add(User(**convert(user), password_hash=hash_password(password)))
        credentials.append((user["email"], password))
    db.flush()
    for model in [
        Membership,
        Course,
        Lesson,
        LearningPath,
        Enrollment,
        Completion,
        TenantExtension,
    ]:
        for row in tables[model.__tablename__]:
            db.add(model(**convert(row)))
        db.flush()
    owner = next((m for m in tables["memberships"] if m["role"] == "owner"), None)
    if owner:
        db.add(
            Workspace(
                owner_id=uuid.UUID(owner["user_id"]),
                tenant_id=uuid.UUID(tenant_id),
                slug=data["tenant"]["slug"],
                name=data["tenant"]["name"],
                template_id=data["tenant"]["template_id"],
                data=data["tenant"]["published_page"],
            )
        )
    db.commit()
    return credentials


def convert(row):
    result = dict(row)
    for key, value in result.items():
        if value is not None and (key == "id" or key.endswith("_id")):
            # template_id/package_id are names, not UUID foreign keys.
            if key not in {"template_id", "package_id"}:
                result[key] = uuid.UUID(value)
        if key == "created_at":
            result[key] = datetime.fromisoformat(value)
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("snapshot", type=Path)
    args = parser.parse_args()
    if get_settings().instance_mode != "standalone":
        parser.error("Set INSTANCE_MODE=standalone first")
    with Session(get_engine()) as session:
        values = restore(json.loads(args.snapshot.read_text()), session)
    for email, password in values:
        print(f"{email}: {password}")
    print(
        "Generated new passwords; share each account only through an appropriate private channel."
    )
