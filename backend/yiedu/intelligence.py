"Schema-constrained OpenAI generation, quotas, persisted review and explicit apply."

import uuid
from datetime import UTC, datetime, timedelta
from html import escape
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import Field, ValidationError
from sqlalchemy import func, select

from yiedu.auth import DB, UserDep
from yiedu.authoring import validate_lesson_document, validate_site
from yiedu.billing import subscription, writable
from yiedu.business_models import AIDraft
from yiedu.business_schemas import ApplyDraft, GenerateRequest, TemplateWrite
from yiedu.connections import connection, scope_access, unseal
from yiedu.managed_catalog import document
from yiedu.models import Course, Lesson, StudioAsset, User
from yiedu.product import commit, encode
from yiedu.product_schemas import StrictModel
from yiedu.studio_schema import validate_project
from yiedu.template_library import heading, paragraph

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


class GeneratedLesson(StrictModel):
    title: str = Field(min_length=1, max_length=180)
    explanation: str = Field(min_length=30, max_length=6000)
    example: str = Field(min_length=20, max_length=4000)
    exercise: str = Field(min_length=20, max_length=3000)
    answer: str = Field(min_length=20, max_length=3000)
    simulation: Literal["none", "sorting", "scaling", "pid", "differential-drive"]


class GeneratedCourse(StrictModel):
    title: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=20, max_length=3000)
    lessons: list[GeneratedLesson] = Field(min_length=2, max_length=8)


class GeneratedPage(StrictModel):
    title: str = Field(min_length=1, max_length=80)
    headline: str = Field(min_length=1, max_length=180)
    body: str = Field(min_length=30, max_length=3000)
    highlights: list[str] = Field(min_length=2, max_length=6)


class GeneratedAcademy(StrictModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=20, max_length=2000)
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    pages: list[GeneratedPage] = Field(min_length=3, max_length=5)
    courses: list[GeneratedCourse] = Field(min_length=1, max_length=4)


def strict_schema(model):
    schema = model.model_json_schema()

    def visit(item):
        if isinstance(item, dict):
            item.pop("default", None)
            if item.get("type") == "object":
                item["additionalProperties"] = False
                item["required"] = list(item.get("properties", {}))
            for value in item.values():
                visit(value)
        elif isinstance(item, list):
            for value in item:
                visit(value)

    visit(schema)
    return schema


def openai_generate(config, secret, payload):
    model = GeneratedAcademy if payload.kind == "template" else GeneratedCourse
    try:
        response = httpx.post(
            "https://api.openai.com/v1/responses",
            headers={"Authorization": "Bearer " + secret["api_key"]},
            timeout=httpx.Timeout(100, connect=10),
            json={
                "model": config["model"],
                "store": False,
                "max_output_tokens": int(config.get("max_output_tokens", 12000)),
                "instructions": (
                    "You are an instructional designer. Produce original, accurate "
                    "teaching material with concrete worked examples, exercises and "
                    "reference answers. Do not claim accreditation, verified facts you "
                    "cannot establish, invent video URLs, or copy textbooks. Use a "
                    "simulation only when the supported physical/computing model matches "
                    "the subject; otherwise select none. Output language: "
                )
                + payload.locale,
                "input": payload.prompt,
                "text": {
                    "format": {
                        "type": "json_schema",
                        "name": "academy" if payload.kind == "template" else "course",
                        "strict": True,
                        "schema": strict_schema(model),
                    }
                },
            },
        )
        if response.status_code >= 400:
            raise HTTPException(
                502,
                f"OpenAI trả lỗi {response.status_code}; "
                "kiểm tra API key, model và hạn mức / Check API connection",
            )
        data = response.json()
        if data.get("status") != "completed":
            raise HTTPException(
                502,
                (
                    "AI chưa hoàn tất; rút gọn yêu cầu hoặc tăng giới hạn đầu ra / "
                    "Incomplete AI response"
                ),
            )
        content = [
            c
            for item in data.get("output", [])
            for c in item.get("content", [])
            if c.get("type") == "output_text"
        ]
        text = "".join(c["text"] for c in content)
        result = model.model_validate_json(text).model_dump()
        return result, {
            "model": config["model"],
            "response_id": data.get("id", ""),
            "tokens": data.get("usage", {}),
        }
    except httpx.HTTPError, ValueError, KeyError, ValidationError:
        raise HTTPException(
            502,
            (
                "AI chưa tạo được dữ liệu hợp lệ. Lần tạo được lưu để kiểm tra / AI "
                "response unavailable or invalid"
            ),
        ) from None


def draft_view(row):
    return {k: v for k, v in encode(row).items() if k != "actor_id"}


@router.get("/{scope}/drafts")
def ai_history(scope: str, user: UserDep, db: DB):
    scope_access(scope, user, db, ai=True)
    return [
        {
            **draft_view(r),
            "title": r.result.get("content", {}).get("title")
            or r.result.get("content", {}).get("name", ""),
            "result": {},
        }
        for r in db.scalars(
            select(AIDraft)
            .where(AIDraft.scope == scope, AIDraft.status != "deleted")
            .order_by(AIDraft.created_at.desc())
            .limit(50)
        )
    ]


@router.get("/{scope}/drafts/{draft_id}")
def read_ai_draft(scope: str, draft_id: uuid.UUID, user: UserDep, db: DB):
    scope_access(scope, user, db, ai=True)
    row = db.scalar(
        select(AIDraft).where(
            AIDraft.scope == scope, AIDraft.id == draft_id, AIDraft.status != "deleted"
        )
    )
    if not row:
        raise HTTPException(404, "AI draft not found")
    return draft_view(row)


@router.post("/{scope}/generate", status_code=201)
def generate(scope: str, payload: GenerateRequest, user: UserDep, db: DB):
    tenant_id = scope_access(scope, user, db, ai=True)
    if tenant_id:
        if payload.kind == "template":
            raise HTTPException(
                403,
                (
                    "Chỉ quản trị YiEdu tạo template hệ thống / Platform templates "
                    "require administrator"
                ),
            )
        writable(db, tenant_id, "courses")
    # A durable reservation survives client navigation; no automatic paid retries.
    db.execute(select(User.id).where(User.id == user.id).with_for_update())
    prior = db.scalar(
        select(AIDraft).where(
            AIDraft.actor_id == user.id, AIDraft.request_key == str(payload.request_key)
        )
    )
    if prior:
        if prior.scope != scope or prior.prompt != payload.prompt or prior.kind != payload.kind:
            raise HTTPException(409, "Request key reused for a different generation")
        return draft_view(prior)
    conn = connection(db, scope, "openai")
    if not conn or not conn.enabled:
        raise HTTPException(409, "Kết nối OpenAI API trước khi tạo / Connect OpenAI API first")
    # Lock the shared connection so simultaneous instructors cannot exceed the daily budget.
    db.execute(select(type(conn).id).where(type(conn).id == conn.id).with_for_update())
    midnight = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    count = db.scalar(
        select(func.count())
        .select_from(AIDraft)
        .where(AIDraft.scope == scope, AIDraft.created_at >= midnight)
    )
    limit = int(conn.config.get("daily_limit", 20))
    if tenant_id:
        limit = min(limit, subscription(db, tenant_id)["limits"]["ai_daily"])
    if count >= limit:
        raise HTTPException(429, "Đã đạt giới hạn AI hôm nay / Daily AI limit reached")
    secret = unseal(conn.encrypted_secret)
    row = AIDraft(
        scope=scope,
        actor_id=user.id,
        kind=payload.kind,
        prompt=payload.prompt,
        request_key=str(payload.request_key),
    )
    db.add(row)
    commit(db)
    try:
        result, usage = openai_generate(conn.config, secret, payload)
        row.result = {
            "content": result,
            "locale": payload.locale,
            "base_template": payload.base_template,
        }
        row.usage, row.status = usage, "ready"
    except HTTPException as exc:
        row.status = "failed"
        row.usage = {"error": exc.detail}
        commit(db)
        raise
    commit(db)
    return draft_view(row)


def lesson_material(item, locale):
    vi = locale == "vi"
    parts = [
        ("Nguyên lý" if vi else "Concept", item["explanation"]),
        ("Ví dụ" if vi else "Worked example", item["example"]),
        ("Thực hành" if vi else "Practice", item["exercise"]),
        ("Đáp án tham khảo" if vi else "Reference answer", item["answer"]),
    ]
    slides = validate_project(
        "slides",
        {
            "slides": [
                {"id": f"slide-{i}", "title": title, "body": body, "notes": body, "duration": 25}
                for i, (title, body) in enumerate(parts)
            ]
        },
    )
    nodes = [node for title, body in parts for node in [heading(title), paragraph(body)]]
    nodes.append(
        {
            "type": "studioAsset",
            "attrs": {
                "kind": "slides",
                "title": item["title"],
                "payload": slides,
            },
        }
    )
    simulation = None
    if item["simulation"] != "none":
        simulation = validate_project("simulation", {"model": item["simulation"], "parameters": {}})
        nodes.append(
            {
                "type": "studioAsset",
                "attrs": {
                    "kind": "simulation",
                    "title": item["title"],
                    "payload": simulation,
                },
            }
        )
    doc = validate_lesson_document({"type": "doc", "content": nodes})
    return (
        {
            "title": item["title"],
            "content": "\n\n".join(body for _, body in parts),
            "document": doc,
        },
        slides,
        simulation,
    )


def course_payload(item, locale):
    return {
        "title": item["title"],
        "description": item["description"],
        "lessons": [
            {**lesson_material(lesson, locale)[0], "position": i}
            for i, lesson in enumerate(item["lessons"])
        ],
    }


def academy_document(db, data, base_template, locale):
    doc = document(db, base_template)
    doc["branding"].update(text=data["name"], color=data["color"], logo_url="")
    css = (
        ":root{--accent:"
        + data["color"]
        + (
            ";}*{box-sizing:border-box}body{margin:0;font:16px/1.7 Arial,sans-ser"
            "if;color:#1c3430;background:#fbfcf9}.wrap{max-width:1120px;margin:au"
            "to;padding:72px 6%}.hero{background:#edf4ef}.hero h1{font-size:clamp"
            "(36px,5vw,68px);line-height:1.1;max-width:850px}.hero p{max-width:72"
            "0px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax("
            "220px,1fr));gap:24px}.card{padding:28px;border:1px solid #dbe6df;bor"
            "der-radius:18px;background:white}.button{display:inline-block;paddin"
            "g:14px 24px;background:var(--accent);color:white;border-radius:9px;t"
            "ext-decoration:none}"
        )
    )
    pages, menu = [], []
    for i, p in enumerate(data["pages"]):
        key = "home" if i == 0 else "programs" if i == 1 else f"page-{i + 1}"
        body = (
            '<section class="hero"><div class="wrap"><small>'
            + escape(data["name"])
            + "</small><h1>"
            + escape(p["headline"])
            + "</h1><p>"
            + escape(p["body"])
            + '</p><a class="button" data-template-link="programs" href="#courses">'
            + ("Khám phá khóa học" if locale == "vi" else "Explore courses")
            + '</a></div></section><section class="wrap"><div class="grid">'
            + "".join(
                '<article class="card"><h2>' + escape(title[:160]) + "</h2></article>"
                for title in p["highlights"]
            )
            + '</div></section><section class="wrap" id="courses"><h2>'
            + ("Chương trình học" if locale == "vi" else "Learning programs")
            + '</h2><div data-gadget="yiedu.courses" data-course-limit="30"></div></section>'
        )
        pages.append(
            {
                "id": key,
                "slug": "" if i == 0 else key,
                "title": {"vi": p["title"], "en": p["title"]},
                "vi": {"html": body, "css": css},
                "en": {"html": body, "css": css},
            }
        )
        menu.append(
            {"id": "menu-" + key, "page_id": key, "label": {"vi": p["title"], "en": p["title"]}}
        )
    doc["pages"], doc["menu"] = pages, menu
    return validate_site(doc)


@router.post("/{scope}/drafts/{draft_id}/apply")
def apply(scope: str, draft_id: uuid.UUID, payload: ApplyDraft, user: UserDep, db: DB):
    tenant_id = scope_access(scope, user, db, ai=True)
    row = db.scalar(
        select(AIDraft).where(AIDraft.id == draft_id, AIDraft.scope == scope).with_for_update()
    )
    if not row:
        raise HTTPException(404, "AI draft not found")
    if row.status == "applied":
        return {"id": row.applied_id, "kind": row.kind, "already_applied": True}
    if row.status != "ready":
        raise HTTPException(409, "Only completed drafts can be applied")
    content, locale = row.result["content"], row.result["locale"]
    if row.kind == "template":
        from yiedu.platform import save_template

        if tenant_id or not payload.template_id:
            raise HTTPException(422, "Choose a new template identifier")
        from yiedu.business_models import ManagedTemplate
        from yiedu.managed_catalog import bundled

        if db.get(ManagedTemplate, payload.template_id) or bundled(payload.template_id):
            raise HTTPException(409, "Template identifier exists; choose another to preserve it")
        template = TemplateWrite(
            name=payload.title,
            description=content["description"],
            document=academy_document(db, content, row.result["base_template"], locale),
            color=content["color"],
            courses=[course_payload(c, locale) for c in content["courses"]],
            status="draft",
        )
        # save_template commits; mark applied within the same transaction first.
        row.status, row.applied_id = "applied", payload.template_id
        save_template(payload.template_id, template, user, db)
    elif not tenant_id:
        from yiedu.managed_catalog import as_editable
        from yiedu.platform import save_template

        if not payload.template_id:
            raise HTTPException(422, "Select a template for this course")
        editable = as_editable(db, payload.template_id)
        editable.pop("id")
        course = course_payload(content, locale)
        course["title"] = payload.title
        editable["courses"].append(course)
        editable["status"] = "draft"
        row.status, row.applied_id = "applied", payload.template_id
        save_template(payload.template_id, TemplateWrite.model_validate(editable), user, db)
    else:
        writable(db, tenant_id, "courses")
        c = Course(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            title=payload.title,
            description=content["description"],
            slug="ai-" + uuid.uuid4().hex[:12],
            published=False,
        )
        db.add(c)
        db.flush()
        for i, item in enumerate(content["lessons"]):
            lesson, slides, simulation = lesson_material(item, locale)
            db.add(Lesson(tenant_id=tenant_id, course_id=c.id, position=i, **lesson))
            db.add(
                StudioAsset(
                    tenant_id=tenant_id,
                    kind="slides",
                    title=item["title"],
                    locale=locale,
                    data=slides,
                )
            )
            if simulation:
                db.add(
                    StudioAsset(
                        tenant_id=tenant_id,
                        kind="simulation",
                        title=item["title"],
                        locale=locale,
                        data=simulation,
                    )
                )
        row.status, row.applied_id = "applied", str(c.id)
        commit(db)
    return {"id": row.applied_id, "kind": row.kind, "already_applied": False}


@router.delete("/{scope}/drafts/{draft_id}")
def delete_draft(scope: str, draft_id: uuid.UUID, user: UserDep, db: DB):
    scope_access(scope, user, db, ai=True)
    row = db.scalar(
        select(AIDraft).where(AIDraft.id == draft_id, AIDraft.scope == scope).with_for_update()
    )
    if not row:
        raise HTTPException(404, "AI draft not found")
    if row.status == "generating" and row.created_at > datetime.now(UTC) - timedelta(minutes=5):
        raise HTTPException(409, "Generation still running")
    row.status, row.result, row.prompt = "deleted", {}, "[deleted]"
    commit(db)
    return {"ok": True}
