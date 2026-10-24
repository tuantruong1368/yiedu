"""Content contracts and executable worked examples, without fetching external books."""

import subprocess
import sys

from yiedu.authoring import validate_site
from yiedu.product_schemas import CourseWrite, LessonWrite
from yiedu.template_library import catalog, curriculum, lessons_for, library
from yiedu.template_sites import site_document


def test_library_curricula_and_documents():
    assert len(catalog()) == 15
    assert len(library()["modules"]) == 69
    for template in catalog():
        document = validate_site(site_document(template["id"]))
        assert len(document["pages"]) == 5
        assert len(curriculum(template["id"])) == template["course_count"]
        for page in document["pages"]:
            assert page["vi"]["html"] != page["en"]["html"]
    for module_id in library()["modules"]:
        lessons = lessons_for(module_id)
        assert len(lessons) == 4
        for lesson in lessons:
            parsed = LessonWrite(**lesson)
            assert parsed.document and parsed.translations["en"]["document"]
    for key in ["yirobot", "software-engineering"]:
        courses = curriculum(key)
        assert len(courses) == 32
        assert {x["curriculum_meta"]["semester"] for x in courses} == set(range(1, 9))


def test_authored_code_examples():
    for module in library()["modules"].values():
        if module["code"]:
            result = subprocess.run(
                [sys.executable, "-I", "-c", module["code"]],
                capture_output=True,
                text=True,
                timeout=3,
                check=True,
            )
            assert result.stdout.strip() == module["code_output"].strip(), module["id"]


def test_empty_course_translation_keeps_source_fallback():
    course = CourseWrite(
        title="Source", slug="source", translations={"en": {"title": "", "description": " "}}
    )
    assert course.translations == {"en": {}}


def test_groups_cover_every_template_and_yoga_has_attributed_tutorials():
    groups = {g["id"] for g in library()["groups"]}
    assert len(groups) == 7
    assert set().union(*(set(t["group_ids"]) for t in catalog())) == groups
    for item in catalog():
        assert item["group_ids"] and set(item["group_ids"]) <= groups
    yoga = library()["templates"]["yoga-studio"]
    assert len(yoga["module_ids"]) == 4
    seen = set()
    for module in yoga["module_ids"]:
        for lesson in lessons_for(module):
            for version in [lesson, lesson["translations"]["en"]]:
                assert len(version["content"]) > 1000
                nodes = version["document"]["content"]
                videos = [n for n in nodes if n["type"] == "youtube"]
                assert len(videos) == 1
                seen.add(videos[0]["attrs"]["src"])
                assert "Yoga With Adriene" in version["content"]
    assert len(seen) == 6


def test_public_template_render_resolves_preview_links_and_validates_routes():
    from fastapi.testclient import TestClient
    from yiedu.main import app

    client = TestClient(app)
    response = client.get("/api/v1/catalog/templates/yoga-studio/render?page=programs")
    assert response.status_code == 200
    assert response.text.count('class="yd-course"') == 4
    assert "/templates/yoga-studio?course=yoga-foundations#lessons" in response.text
    assert "nonce-" in response.headers["content-security-policy"]
    assert response.headers["x-content-type-options"] == "nosniff"
    assert client.get("/api/v1/catalog/template-groups").status_code == 200
    assert (
        client.get("/api/v1/catalog/templates/yoga-studio/render?page=missing").status_code == 404
    )
    assert client.get("/api/v1/catalog/templates/missing/render").status_code == 404
    assert client.get("/api/v1/catalog/templates/yoga-studio/render?locale=fr").status_code == 422
