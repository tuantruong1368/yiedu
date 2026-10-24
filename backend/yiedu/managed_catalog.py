"""Database overrides for bundled templates; published tenants remain independent copies."""

import copy
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select

from yiedu.business_models import ManagedTemplate
from yiedu.catalog import TEMPLATES, initial_page
from yiedu.models import Course, LearningPath, Lesson
from yiedu.template_library import curriculum, lessons_for


def bundled(key):
    return next((copy.deepcopy(t) for t in TEMPLATES if t["id"] == key), None)


def entry(db, key, hidden=False):
    row = db.get(ManagedTemplate, key)
    if row:
        if row.status != "published" and not hidden:
            raise HTTPException(404, "Template not found")
        return row
    if not bundled(key):
        raise HTTPException(404, "Template not found")
    return None


def metadata(row):
    return {
        **row.metadata_json,
        "id": row.id,
        "course_count": len(row.courses),
        "lesson_count": sum(len(c.get("lessons", [])) for c in row.courses),
        "page_count": len(row.document["pages"]),
        "semester_count": 0,
        "version": str(row.revision),
        "review_status": "owner-reviewed",
        "content_depth": "custom",
    }


def public_catalog(db):
    overrides = {r.id: r for r in db.scalars(select(ManagedTemplate))}
    result = [
        metadata(overrides[t["id"]]) if t["id"] in overrides else t
        for t in TEMPLATES
        if t["id"] not in overrides or overrides[t["id"]].status == "published"
    ]
    return result + [
        metadata(r) for r in overrides.values() if not bundled(r.id) and r.status == "published"
    ]


def preview(db, key, hidden=False):
    row = entry(db, key, hidden)
    if row:
        return {
            "template": metadata(row),
            "document": copy.deepcopy(row.document),
            "courses": [
                {
                    "id": f"course-{i + 1}",
                    "title": c["title"],
                    "description": c.get("description", ""),
                    "translations": {},
                    "curriculum_meta": {},
                    "lesson_count": len(c["lessons"]),
                }
                for i, c in enumerate(row.courses)
            ],
        }
    return {"template": bundled(key), "document": initial_page(key), "courses": curriculum(key)}


def document(db, key, name=None, hidden=False):
    doc = preview(db, key, hidden)["document"]
    if name:
        doc["branding"]["text"] = name
    return doc


def template_lessons(db, key, course_key):
    row = entry(db, key)
    if row:
        try:
            index = int(course_key.removeprefix("course-")) - 1
            if index < 0:
                raise ValueError
            return copy.deepcopy(row.courses[index]["lessons"])
        except ValueError, IndexError:
            raise HTTPException(404, "Learning unit not found") from None
    if course_key not in [c["id"] for c in curriculum(key)]:
        raise HTTPException(404, "Learning unit not found")
    return lessons_for(course_key)


def as_editable(db, key):
    row = entry(db, key, hidden=True)
    if row:
        meta = row.metadata_json
        return {
            "id": key,
            "name": meta["name"],
            "description": meta.get("description", ""),
            "description_en": meta.get("description_en", ""),
            "category_id": meta.get("group_ids", ["business"])[0],
            "color": meta["color"],
            "document": row.document,
            "courses": row.courses,
            "status": row.status,
            "revision": row.revision,
        }
    data = preview(db, key)
    t = data["template"]
    return {
        "id": key,
        "name": t["name"],
        "description": t["description"],
        "description_en": t.get("description_en", ""),
        "category_id": t.get("group_ids", ["business"])[0],
        "color": t["color"],
        "document": data["document"],
        "courses": [
            {"title": c["title"], "description": c["description"], "lessons": lessons_for(c["id"])}
            for c in data["courses"]
        ],
        "status": "published",
        "revision": 0,
    }


def seed_managed(db, tenant):
    row = db.get(ManagedTemplate, tenant.template_id)
    if row is None:
        return False
    if tenant.template_seed:
        return True
    records = []
    for i, c in enumerate(row.courses):
        course = Course(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            title=c["title"],
            slug=f"template-course-{i + 1}",
            description=c.get("description", ""),
            published=True,
        )
        db.add(course)
        db.flush()
        for lesson in c["lessons"]:
            db.add(Lesson(tenant_id=tenant.id, course_id=course.id, **lesson))
        records.append(str(course.id))
    if records:
        db.add(
            LearningPath(tenant_id=tenant.id, title=row.metadata_json["name"], course_ids=records)
        )
    tenant.template_seed = {
        "template_id": row.id,
        "version": str(row.revision),
        "installed_at": datetime.now(UTC).isoformat(),
        "course_count": len(records),
        "lesson_count": sum(len(c["lessons"]) for c in row.courses),
        "review_status": "owner-reviewed",
        "media_version": "custom",
    }
    return True
