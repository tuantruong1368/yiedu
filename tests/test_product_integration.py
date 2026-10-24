import importlib.util
import io
import json
import os
import uuid
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from yiedu.db import get_session
from yiedu.main import app
from yiedu.models import Base
from yiedu.product import _attempts

pytestmark = pytest.mark.integration


@pytest.fixture
def clients():
    url = os.getenv("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL required")
    engine = create_engine(url)
    connection = engine.connect()
    transaction = connection.begin()

    def sessions():
        with Session(bind=connection, join_transaction_mode="create_savepoint") as session:
            yield session

    app.dependency_overrides[get_session] = sessions
    _attempts.clear()
    with TestClient(app) as owner, TestClient(app) as learner, TestClient(app) as outsider:
        yield owner, learner, outsider, connection
    app.dependency_overrides.clear()
    transaction.rollback()
    connection.close()
    engine.dispose()


def register(client, name):
    suffix = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"{name}-{suffix}@example.com",
            "name": name,
            "password": "strong-example-password",
            "client": "native",
        },
    )
    assert response.status_code == 201, response.text
    client.cookies.clear()
    client.headers["Authorization"] = "Bearer " + response.json()["token"]
    return response.json()


def create_site(client):
    slug = "lab-" + uuid.uuid4().hex[:10]
    response = client.post(
        "/api/v1/workspaces",
        json={
            "name": "Lab School",
            "slug": slug,
            "template_id": "academy",
            "include_sample_content": False,
        },
    )
    assert response.status_code == 201, response.text
    workspace = response.json()
    response = client.post(f"/api/v1/workspaces/{workspace['id']}/publish")
    assert response.status_code == 200, response.text
    return workspace, response.json()["tenant"]


def test_owner_builder_isolation_and_csrf(clients):
    owner, learner, outsider, _ = clients
    register(owner, "owner")
    register(outsider, "outsider")
    w, tenant = create_site(owner)
    path = f"/api/v1/workspaces/{w['id']}"
    assert outsider.get(path).status_code == 404
    assert outsider.post(path + "/publish").status_code == 404
    assert outsider.get(f"/api/v1/runtime/{tenant['id']}/overview").status_code == 403
    saved = owner.put(
        path, json={"name": w["name"], "slug": w["slug"], "revision": 1, "data": w["data"]}
    )
    assert saved.status_code == 200
    assert (
        owner.put(
            path, json={"name": w["name"], "slug": w["slug"], "revision": 1, "data": w["data"]}
        ).status_code
        == 409
    )
    again = owner.post(path + "/publish")
    assert again.json()["tenant"]["id"] == tenant["id"]
    invalid = dict(w["data"], content=[{"type": "Script", "props": {"id": "bad"}}])
    assert (
        owner.put(
            path, json={"name": w["name"], "slug": w["slug"], "revision": 2, "data": invalid}
        ).status_code
        == 422
    )
    # Cookie auth rejects cross-origin mutations even when the browser sends credentials.
    learner.cookies.set("yiedu_session", "anything")
    assert (
        learner.post(
            "/api/v1/auth/logout", headers={"Origin": "https://attacker.example"}
        ).status_code
        == 403
    )
    assert learner.post("/api/v1/auth/logout").status_code == 403


def test_learning_path_progress_extension_and_export(clients):
    owner, learner, outsider, connection = clients
    register(owner, "owner")
    register(learner, "learner")
    register(outsider, "outsider")
    _, tenant = create_site(owner)
    base = f"/api/v1/runtime/{tenant['id']}"
    assert learner.post(f"/api/v1/sites/{tenant['slug']}/join").json()["role"] == "learner"
    courses, lessons = [], []
    for index in range(2):
        response = owner.post(
            base + "/courses",
            json={"title": f"Course {index}", "slug": f"course-{index}", "published": True},
        )
        assert response.status_code == 201, response.text
        course = response.json()
        courses.append(course)
        response = owner.post(
            base + f"/courses/{course['id']}/lessons",
            json={"title": "Lesson", "content": "Real lesson content"},
        )
        assert response.status_code == 201, response.text
        lessons.append(response.json())
    response = owner.post(
        base + "/paths", json={"title": "Ordered path", "course_ids": [c["id"] for c in courses]}
    )
    assert response.status_code == 201
    assert (
        owner.post(
            base + "/paths",
            json={"title": "Cycle", "course_ids": [c["id"] for c in reversed(courses)]},
        ).status_code
        == 422
    )
    assert (
        learner.post(base + "/courses", json={"title": "Illegal", "slug": "illegal"}).status_code
        == 403
    )
    assert learner.get(base + f"/lessons/{lessons[0]['id']}").status_code == 403
    for c in courses:
        assert learner.post(base + f"/courses/{c['id']}/enroll").status_code == 200
    assert learner.get(base + f"/lessons/{lessons[1]['id']}").status_code == 403
    assert (
        learner.get(base + f"/lessons/{lessons[0]['id']}").json()["content"]
        == "Real lesson content"
    )
    for package in ["yiedu.certificates", "yiedu.activity-log"]:
        assert owner.put(base + "/extensions/" + package, json={"enabled": True}).status_code == 200
    assert (
        learner.put(base + "/extensions/yiedu.certificates", json={"enabled": False}).status_code
        == 403
    )
    for lesson in lessons:
        for _ in range(2):
            assert learner.post(base + f"/lessons/{lesson['id']}/complete").status_code == 200
    overview = learner.get(base + "/overview").json()
    assert len(overview["completed"]) == 2
    assert owner.get(base + "/overview").json()["members"][1]["role"] in {"owner", "learner"}
    assert learner.get(base + f"/courses/{courses[0]['id']}/certificate").status_code == 200
    assert learner.get(base + "/export").status_code == 403
    response = owner.get(base + "/export")
    assert response.status_code == 200, response.text
    archive = zipfile.ZipFile(io.BytesIO(response.content))
    snapshot = json.loads(archive.read("snapshot.json"))
    manifest = json.loads(archive.read("export-manifest.json"))
    assert "web/package.json" in archive.namelist()
    assert all(".env" not in name and "auth_sessions" not in name for name in archive.namelist())
    assert "password_hash" not in json.dumps(snapshot)
    assert "token_hash" not in json.dumps(snapshot)
    assert len(snapshot["users"]) == 2
    assert manifest["tenant_id"] == tenant["id"]
    # Verify snapshot can be restored to a separate empty schema, not just serialized.
    spec = importlib.util.spec_from_file_location(
        "restore", Path(__file__).resolve().parents[1] / "scripts/restore_snapshot.py"
    )
    restore = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(restore)
    schema = "restore_" + uuid.uuid4().hex[:10]
    connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    connection.execution_options(schema_translate_map={None: schema})
    try:
        Base.metadata.create_all(connection)
        with Session(bind=connection, join_transaction_mode="create_savepoint") as target:
            generated = restore.restore(snapshot, target)
            assert {email for email, _ in generated} == {u["email"] for u in snapshot["users"]}
            assert all(len(password) >= 20 for _, password in generated)
    finally:
        connection.execution_options(schema_translate_map=None)


def test_login_logout_and_reserved_domain(clients):
    owner, learner, _, _ = clients
    info = register(owner, "owner")
    assert owner.post("/api/v1/workspaces", json={"name": "API", "slug": "api"}).status_code == 422
    response = owner.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert owner.get("/api/v1/auth/me").status_code == 401
    response = learner.post(
        "/api/v1/auth/login",
        json={"email": info["user"]["email"], "password": "incorrect-password", "client": "native"},
    )
    assert response.status_code == 401
    response = learner.post(
        "/api/v1/auth/login",
        json={
            "email": info["user"]["email"],
            "password": "strong-example-password",
            "client": "native",
        },
    )
    assert response.status_code == 200


def test_bilingual_site_rich_lesson_and_tenant_isolation(clients):
    from test_authoring import site

    owner, learner, outsider, _ = clients
    register(owner, "author")
    register(outsider, "other-author")
    w, tenant = create_site(owner)
    document = site()
    document["branding"]["text"] = "Own brand"
    document["pages"][0]["vi"]["html"] += "<script>alert(1)</script>"
    response = owner.put(
        "/api/v1/workspaces/" + w["id"],
        json={"name": w["name"], "slug": w["slug"], "revision": 1, "data": document},
    )
    assert response.status_code == 200, response.text
    assert "<script" not in response.json()["data"]["pages"][0]["vi"]["html"]
    assert (
        outsider.put(
            "/api/v1/workspaces/" + w["id"],
            json={"name": w["name"], "slug": w["slug"], "revision": 2, "data": document},
        ).status_code
        == 404
    )
    response = owner.post("/api/v1/workspaces/" + w["id"] + "/publish")
    assert response.status_code == 200, response.text
    assert (
        owner.get("/api/v1/sites/" + w["slug"]).json()["tenant"]["branding"]["text"] == "Own brand"
    )
    base = "/api/v1/runtime/" + tenant["id"]
    course = owner.post(
        base + "/courses", json={"title": "Rich course", "slug": "rich", "published": True}
    ).json()
    rich = {
        "type": "doc",
        "content": [{"type": "simulation", "attrs": {"frequency": 2, "amplitude": 1}}],
    }
    lesson = owner.post(
        base + "/courses/" + course["id"] + "/lessons",
        json={
            "title": "Rich lesson",
            "content": "Plain fallback",
            "document": rich,
            "translations": {"en": {"title": "English lesson", "document": rich}},
        },
    )
    assert lesson.status_code == 201, lesson.text
    lid = lesson.json()["id"]
    assert owner.get(base + "/lessons/" + lid).json()["document"] == rich
    assert outsider.get(base + "/lessons/" + lid).status_code == 403
    register(learner, "rich-learner")
    learner.post("/api/v1/sites/" + w["slug"] + "/join")
    assert learner.get(base + "/lessons/" + lid).status_code == 403
    learner.post(base + "/courses/" + course["id"] + "/enroll")
    assert (
        learner.get(base + "/lessons/" + lid).json()["translations"]["en"]["title"]
        == "English lesson"
    )
    overview = learner.get(base + "/overview").json()
    assert "document" not in overview["lessons"][0]
    assert "translations" not in overview["lessons"][0]

    bundle = zipfile.ZipFile(io.BytesIO(owner.get(base + "/export").content))
    exported = json.loads(bundle.read("snapshot.json"))
    assert exported["schema_version"] == "0005"
    assert exported["tables"]["lessons"][0]["document"] == rich


def test_template_seed_is_isolated_and_idempotent(clients):
    owner, learner, _, _ = clients
    register(owner, "TemplateOwner")
    register(learner, "TemplateLearner")
    preview = learner.get("/api/v1/catalog/templates/yirobot")
    assert preview.status_code == 200
    assert len(preview.json()["courses"]) == 32
    assert learner.get("/api/v1/catalog/templates/yirobot/courses/sales").status_code == 404
    workspace = owner.post(
        "/api/v1/workspaces",
        json={
            "name": "Robot School",
            "slug": "robot-" + uuid.uuid4().hex[:8],
            "template_id": "yirobot",
        },
    ).json()
    response = owner.post(f"/api/v1/workspaces/{workspace['id']}/publish")
    assert response.status_code == 200, response.text
    tenant = response.json()["tenant"]
    base = f"/api/v1/runtime/{tenant['id']}"
    overview = owner.get(base + "/overview").json()
    assert len(overview["courses"]) == 32
    assert len(overview["lessons"]) == 128
    assert len(overview["paths"]) == 9
    assert tenant["template_seed"]["version"] == "2026.10.2"
    ids = {x["id"] for x in overview["courses"]}
    assert owner.post(f"/api/v1/workspaces/{workspace['id']}/publish").status_code == 200
    assert {x["id"] for x in owner.get(base + "/overview").json()["courses"]} == ids
    assert learner.get(base + "/overview").status_code == 403


def test_studio_isolation_revisions_embedded_snapshots_and_export_restore(clients):
    from yiedu.learning_media import presentation_for
    from yiedu.template_library import get_module

    owner, learner, outsider, connection = clients
    register(owner, "StudioOwner")
    register(learner, "StudioLearner")
    register(outsider, "StudioOutsider")
    w, tenant = create_site(owner)
    base = f"/api/v1/runtime/{tenant['id']}"
    learner.post(f"/api/v1/sites/{tenant['slug']}/join")
    payload = {
        "title": "A reusable deck",
        "kind": "slides",
        "locale": "vi",
        "data": presentation_for(get_module("python"), "vi"),
    }
    response = owner.post(base + "/studio", json=payload)
    assert response.status_code == 201, response.text
    row = response.json()
    url = base + "/studio/" + row["id"]
    assert row["revision"] == 1
    assert learner.get(base + "/studio").status_code == 403
    assert outsider.get(url).status_code == 403
    assert learner.post(base + "/studio", json=payload).status_code == 403
    # Same membership on another tenant never confers access to this asset.
    _, other = create_site(owner)
    assert owner.get(f"/api/v1/runtime/{other['id']}/studio/{row['id']}").status_code == 404
    updated = owner.put(url, json={**payload, "title": "Updated deck", "revision": 1})
    assert updated.status_code == 200, updated.text
    assert updated.json()["revision"] == 2
    assert owner.put(url, json={**payload, "revision": 1}).status_code == 409
    assert owner.put(url, json={**payload, "kind": "video", "revision": 2}).status_code == 422
    course = owner.post(
        base + "/courses",
        json={
            "title": "Studio Course",
            "slug": "studio-course",
            "published": True,
        },
    ).json()
    doc = {
        "type": "doc",
        "content": [
            {
                "type": "studioAsset",
                "attrs": {
                    "title": payload["title"],
                    "kind": "slides",
                    "payload": payload["data"],
                },
            }
        ],
    }
    lesson = owner.post(
        base + f"/courses/{course['id']}/lessons",
        json={
            "title": "Embedded media",
            "content": "Accessible fallback",
            "document": doc,
        },
    ).json()
    edited = owner.put(
        base + "/lessons/" + lesson["id"],
        json={
            "title": "Embedded media",
            "document": doc,
            "revision": 1,
        },
    )
    assert edited.status_code == 200
    assert edited.json()["revision"] == 2
    assert (
        owner.put(
            base + "/lessons/" + lesson["id"],
            json={
                "title": "Stale edit",
                "revision": 1,
            },
        ).status_code
        == 409
    )
    learner.post(base + f"/courses/{course['id']}/enroll")
    assert learner.get(base + "/lessons/" + lesson["id"]).json()["document"] == doc
    exported = zipfile.ZipFile(io.BytesIO(owner.get(base + "/export").content))
    snapshot = json.loads(exported.read("snapshot.json"))
    assert snapshot["schema_version"] == "0005"
    assert len(snapshot["tables"]["studio_assets"]) == 1
    # Restore into an actually empty destination within the transaction.
    spec = importlib.util.spec_from_file_location(
        "restore_studio", Path("scripts/restore_snapshot.py")
    )
    restore_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(restore_module)
    schema = "studio_restore_" + uuid.uuid4().hex[:10]
    connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    connection.execution_options(schema_translate_map={None: schema})
    try:
        Base.metadata.create_all(connection)
        with Session(bind=connection, join_transaction_mode="create_savepoint") as target:
            restored = restore_module.restore(snapshot, target)
            assert len(restored) == 2
            from yiedu.models import StudioAsset

            asset = target.get(StudioAsset, uuid.UUID(row["id"]))
            assert asset.data == payload["data"]
    finally:
        connection.execution_options(schema_translate_map=None)
    assert owner.delete(url).status_code == 204
    assert learner.get(base + "/lessons/" + lesson["id"]).json()["document"] == doc
    assert owner.get(url).status_code == 404
    # Keep cross-tenant snapshot checks, including Studio records.
    from yiedu.models import StudioAsset

    assert not connection.execute(
        text("SELECT id FROM studio_assets WHERE id=:id"), {"id": row["id"]}
    ).first()
    assert StudioAsset.__tablename__ in snapshot["tables"]


def test_starter_upgrade_preserves_teacher_edits_and_does_not_duplicate_assets(clients):
    owner, _, _, connection = clients
    register(owner, "StarterUpgradeOwner")
    workspace = owner.post(
        "/api/v1/workspaces",
        json={
            "name": "Existing School",
            "slug": "existing-" + uuid.uuid4().hex[:8],
            "template_id": "yirobot",
        },
    ).json()
    response = owner.post(f"/api/v1/workspaces/{workspace['id']}/publish")
    assert response.status_code == 200, response.text
    tenant = response.json()["tenant"]
    base = f"/api/v1/runtime/{tenant['id']}"
    assets = owner.get(base + "/studio").json()
    assert len(assets) > 128
    result = owner.post(base + "/studio/starter-content/upgrade")
    assert result.status_code == 200, result.text
    assert result.json()["assets_added"] == 0
    assert result.json()["lessons_updated"] == 0
    assert len(owner.get(base + "/studio").json()) == len(assets)
    # Rebuild an untouched 0.5 principle lesson, then prove upgrade matches its fingerprint.
    from sqlalchemy import select
    from yiedu.models import Course, Lesson
    from yiedu.studio_seed import lesson_fingerprint
    from yiedu.template_library import ROOT, plain_text

    with Session(bind=connection, join_transaction_mode="create_savepoint") as session:
        starter = session.scalar(
            select(Course).where(
                Course.tenant_id == uuid.UUID(tenant["id"]), Course.slug == "tpl-study-skills"
            )
        )
        old_lesson = session.scalar(
            select(Lesson).where(Lesson.course_id == starter.id, Lesson.position == 0)
        )
        old_lesson.document = {
            **old_lesson.document,
            "content": [
                node for node in old_lesson.document["content"] if node["type"] != "studioAsset"
            ],
        }
        old_lesson.content = plain_text(old_lesson.document)
        en = dict(old_lesson.translations["en"])
        en["document"] = {
            **en["document"],
            "content": [
                node for node in en["document"]["content"] if node["type"] != "studioAsset"
            ],
        }
        en["content"] = plain_text(en["document"])
        old_lesson.translations = {"en": en}
        baselines = json.loads((ROOT / "lesson-baselines.json").read_text())
        assert lesson_fingerprint(old_lesson) == baselines["study-skills:0"]
        upgraded_id = str(old_lesson.id)
        session.commit()
    result = owner.post(base + "/studio/starter-content/upgrade")
    assert result.json()["lessons_updated"] == 1, result.text
    upgraded = owner.get(base + "/lessons/" + upgraded_id).json()
    assert any(node["type"] == "studioAsset" for node in upgraded["document"]["content"])
    overview = owner.get(base + "/overview").json()
    lesson = overview["lessons"][0]
    detail = owner.get(base + "/lessons/" + lesson["id"]).json()
    changed = owner.put(
        base + "/lessons/" + lesson["id"],
        json={
            "title": "Teacher has rewritten this lesson",
            "content": "Teacher-owned content",
            "revision": detail["revision"],
        },
    )
    assert changed.status_code == 200
    result = owner.post(base + "/studio/starter-content/upgrade")
    assert result.json()["lessons_updated"] == 0
    assert owner.get(base + "/lessons/" + lesson["id"]).json()["content"] == "Teacher-owned content"


def test_published_render_is_public_fresh_scoped_and_keeps_security_headers(clients):
    owner, _, visitor, _ = clients
    register(owner, "RenderOwner")
    w, tenant = create_site(owner)
    document = w["data"]
    document["pages"][0]["vi"]["html"] += (
        '<section data-gadget="yiedu.courses"><div data-template-preview="true">'
        "PLACEHOLDER</div></section>"
    )
    changed = owner.put(
        f"/api/v1/workspaces/{w['id']}",
        json={
            "name": w["name"],
            "slug": w["slug"],
            "revision": w["revision"],
            "data": document,
        },
    )
    assert changed.status_code == 200, changed.text
    assert owner.post(f"/api/v1/workspaces/{w['id']}/publish").status_code == 200
    base = f"/api/v1/runtime/{tenant['id']}"
    for title, published in [("Public course", True), ("PRIVATE DRAFT", False)]:
        assert (
            owner.post(
                base + "/courses",
                json={
                    "title": title,
                    "slug": title.lower().replace(" ", "-"),
                    "published": published,
                },
            ).status_code
            == 201
        )
    url = f"/api/v1/sites/{tenant['slug']}/render"
    response = visitor.get(url)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert response.headers["cache-control"] == "no-store"
    assert "nonce-" in response.headers["content-security-policy"]
    assert response.headers["x-content-type-options"] == "nosniff"
    assert "Public course" in response.text and "PRIVATE DRAFT" not in response.text
    assert "PLACEHOLDER" not in response.text
    assert visitor.get(url + "?page=missing").status_code == 404
    assert visitor.get(url + "?locale=unsupported").status_code == 422
