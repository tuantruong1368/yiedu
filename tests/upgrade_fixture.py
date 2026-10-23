"""CI-only migration probe, piped into a container; never seed a real database."""

import sys

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session
from yiedu.auth import hash_password
from yiedu.config import get_settings
from yiedu.db import get_engine
from yiedu.main import app
from yiedu.models import (
    Completion,
    Course,
    Enrollment,
    LearningPath,
    Lesson,
    Membership,
    Tenant,
    User,
    Workspace,
)

PAGE = {"root": {"props": {"title": "Trường học tiếng Việt"}}, "content": [], "zones": {}}
EMAIL = "upgrade-probe@example.com"
PASSWORD = "ci-only-upgrade-probe-password"

assert get_settings().database_url, "CI database required"
with Session(get_engine()) as db:
    if sys.argv[1] == "seed":
        assert db.scalar(select(User.id).limit(1)) is None, "CI seed requires empty DB"
        user = User(email=EMAIL, name="Học viên cũ", password_hash=hash_password(PASSWORD))
        tenant = Tenant(slug="upgrade-probe", name="Trường cũ", published_page=PAGE)
        db.add_all([user, tenant])
        db.flush()
        course = Course(tenant_id=tenant.id, slug="robot", title="Robot căn bản", published=True)
        db.add(course)
        db.flush()
        lesson = Lesson(
            tenant_id=tenant.id,
            course_id=course.id,
            title="Bài học cũ",
            content="Tiếng Việt được giữ nguyên.",
        )
        db.add(lesson)
        db.flush()
        db.add_all(
            [
                Membership(tenant_id=tenant.id, user_id=user.id, role="owner"),
                Workspace(
                    owner_id=user.id,
                    tenant_id=tenant.id,
                    template_id="academy",
                    name=tenant.name,
                    slug=tenant.slug,
                    data=PAGE,
                    revision=7,
                ),
                LearningPath(tenant_id=tenant.id, title="Lộ trình cũ", course_ids=[str(course.id)]),
                Enrollment(tenant_id=tenant.id, user_id=user.id, course_id=course.id),
                Completion(tenant_id=tenant.id, user_id=user.id, lesson_id=lesson.id),
            ]
        )
        db.commit()
        print(
            "CI-only tenant, account, builder, course, lesson and progress seeded on PostgreSQL 17."
        )
    else:
        tenant = db.scalar(select(Tenant).where(Tenant.slug == "upgrade-probe"))
        assert tenant and tenant.published_page == PAGE
        workspace = db.scalar(select(Workspace).where(Workspace.tenant_id == tenant.id))
        assert workspace.data == PAGE and workspace.revision == 7
        lesson = db.scalar(select(Lesson).where(Lesson.tenant_id == tenant.id))
        assert lesson.content == "Tiếng Việt được giữ nguyên."
        with TestClient(app) as client:
            login = client.post(
                "/api/v1/auth/login",
                json={
                    "email": EMAIL,
                    "password": PASSWORD,
                    "client": "native",
                },
            )
            assert login.status_code == 200, login.text
            client.cookies.clear()
            client.headers["Authorization"] = "Bearer " + login.json()["token"]
            response = client.get(f"/api/v1/runtime/{tenant.id}/overview")
            assert response.status_code == 200, response.text
            overview = response.json()
            assert overview["courses"][0]["title"] == "Robot căn bản"
            assert overview["paths"][0]["course_ids"] == overview["enrolled"]
            assert str(lesson.id) in overview["completed"]
        print(
            "Old login, JSONB builder, course/path/enrollment/completion verified on PostgreSQL 18."
        )
