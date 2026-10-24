"""Copy a template curriculum into a tenant once, in its caller's transaction."""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select

from yiedu.models import Course, LearningPath, Lesson
from yiedu.studio_seed import seed_studio
from yiedu.template_library import curriculum, get_template, lessons_for


def seed_template(db, tenant):
    if tenant.template_seed:
        return {"already_installed": True, **tenant.template_seed}
    t = get_template(tenant.template_id)
    courses = curriculum(t["id"])
    slugs = ["tpl-" + x["id"] for x in courses]
    if db.scalar(
        select(Course.id).where(Course.tenant_id == tenant.id, Course.slug.in_(slugs)).limit(1)
    ):
        raise HTTPException(409, "Template course slug conflicts; existing content was not changed")
    records = []
    for item, slug in zip(courses, slugs, strict=True):
        row = Course(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            slug=slug,
            title=item["title"],
            description=item["description"],
            translations=item["translations"],
            curriculum_meta=item["curriculum_meta"],
            published=True,
        )
        records.append(row)
        db.add(row)
    db.flush()
    ids = {x.curriculum_meta["module_id"]: x.id for x in records}
    for row in records:
        for lesson in lessons_for(row.curriculum_meta["module_id"]):
            db.add(Lesson(tenant_id=tenant.id, course_id=row.id, **lesson))
    db.add(
        LearningPath(
            tenant_id=tenant.id,
            title=t["name"] + " · Lộ trình chính / Main pathway",
            course_ids=[str(x.id) for x in records],
        )
    )
    for i, group in enumerate(t["semesters"]):
        db.add(
            LearningPath(
                tenant_id=tenant.id,
                title=f"Năm / Year {i // 2 + 1} · Học kỳ / Semester {i + 1}",
                course_ids=[str(ids[key]) for key in group],
            )
        )
    summary = {
        "template_id": t["id"],
        "version": t["version"],
        "course_count": len(records),
        "lesson_count": 4 * len(records),
        "path_count": 1 + len(t["semesters"]),
        "installed_at": datetime.now(UTC).isoformat(),
        "review_status": "editorial-draft",
        "content_depth": "compact-learning-units",
        "media_version": "2026.10.2",
        "studio_asset_count": seed_studio(db, tenant),
    }
    tenant.template_seed = summary
    return {"already_installed": False, **summary}
