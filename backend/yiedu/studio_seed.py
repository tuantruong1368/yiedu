"""Install reusable first-party media and update only untouched starter lessons."""

import hashlib
import json
import uuid

from sqlalchemy import select

from yiedu.learning_media import presentation_for, simulation_for
from yiedu.models import Course, Lesson, StudioAsset
from yiedu.template_library import ROOT, get_module, get_template, lessons_for

MEDIA_VERSION = "2026.10.2"


def lesson_fingerprint(lesson):
    keys = ["title", "content", "document", "translations", "position", "video_url"]
    fields = {key: getattr(lesson, key) for key in keys}
    return hashlib.sha256(
        json.dumps(fields, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()


def seed_studio(db, tenant):
    template = get_template(tenant.template_id)
    existing = set(db.scalars(select(StudioAsset.id).where(StudioAsset.tenant_id == tenant.id)))
    added = 0
    for key in template["module_ids"]:
        module = get_module(key)
        for locale in ["vi", "en"]:
            media = [
                ("slides", presentation_for(module, locale)),
                ("video", presentation_for(module, locale, video=True)),
            ]
            simulation = simulation_for(key)
            if simulation:
                media.append(("simulation", simulation))
            for kind, data in media:
                asset_id = uuid.uuid5(tenant.id, f"starter:{key}:{locale}:{kind}")
                if asset_id in existing:
                    continue
                label = {"slides": "Slides", "video": "Video", "simulation": "Lab"}[kind]
                db.add(
                    StudioAsset(
                        id=asset_id,
                        tenant_id=tenant.id,
                        kind=kind,
                        locale=locale,
                        title=(label + " · " + module["title"][locale])[:200],
                        data=data,
                    )
                )
                added += 1
    return added


def upgrade_starter_content(db, tenant):
    baselines = json.loads((ROOT / "lesson-baselines.json").read_text())
    courses = list(db.scalars(select(Course).where(Course.tenant_id == tenant.id)))
    changed, preserved = 0, 0
    for course in courses:
        key = course.curriculum_meta.get("module_id")
        if not key or not course.curriculum_meta.get("template_id"):
            continue
        fresh = lessons_for(key)
        for lesson in db.scalars(
            select(Lesson)
            .where(Lesson.tenant_id == tenant.id, Lesson.course_id == course.id)
            .with_for_update()
        ):
            baseline = baselines.get(f"{key}:{lesson.position}")
            if not baseline or lesson_fingerprint(lesson) != baseline:
                preserved += 1
                continue
            if all(
                getattr(lesson, field) == value for field, value in fresh[lesson.position].items()
            ):
                preserved += 1
                continue
            for field, value in fresh[lesson.position].items():
                setattr(lesson, field, value)
            lesson.revision += 1
            changed += 1
    assets_added = seed_studio(db, tenant)
    tenant.template_seed = {**tenant.template_seed, "media_version": MEDIA_VERSION}
    return {
        "lessons_updated": changed,
        "lessons_preserved": preserved,
        "assets_added": assets_added,
    }
