"""Content contracts and executable worked examples, without fetching external books."""

import subprocess
import sys

from yiedu.authoring import validate_site
from yiedu.product_schemas import CourseWrite, LessonWrite
from yiedu.template_library import catalog, curriculum, lessons_for, library
from yiedu.template_sites import site_document


def test_library_curricula_and_documents():
    assert len(catalog()) == 14
    assert len(library()["modules"]) == 65
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
