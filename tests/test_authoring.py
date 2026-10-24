import copy
import json

import pytest
from pydantic import ValidationError
from yiedu.authoring import clean_css, clean_html, validate_lesson_document, validate_site
from yiedu.extensions.manifest import ExtensionManifest
from yiedu.product_schemas import LessonWrite, WorkspaceUpdate


def site():
    return {
        "schema_version": "2.0",
        "engine": "grapesjs",
        "default_locale": "vi",
        "branding": {"text": "Yi School", "color": "#215d4c", "variant": "circle"},
        "pages": [
            {
                "id": "home",
                "slug": "",
                "title": {"vi": "Trang chủ", "en": "Home"},
                "vi": {"html": "<h1>Xin chào</h1>", "css": "h1{color:red}"},
                "en": {"html": "<h1>Hello</h1>", "css": ""},
            }
        ],
        "menu": [{"id": "main", "page_id": "home", "label": {"vi": "Trang chủ", "en": "Home"}}],
    }


def test_import_sanitizer_removes_executable_content_but_keeps_layout_and_events():
    events = json.dumps([{"event": "click", "action": "message", "message": "Hello"}])
    html = f"""<section style="position:absolute;width:300px" data-events='{events}'>
    <img src="https://example.com/a.png" onerror="alert(1)"><a href="javascript:alert(1)">x</a>
    <script>steal()</script><iframe src="https://evil.example"></iframe></section>"""
    safe = clean_html(html)
    assert "position:absolute" in safe and "width:300px" in safe and "data-events" in safe
    assert all(
        word not in safe for word in ["onerror", "javascript:", "<script", "<iframe", "steal"]
    )
    assert "https://example.com/a.png" in safe
    css = clean_css(
        '@import "https://evil.example";a{color:red;background:url(javascript:evil)}'
        "@media(max-width:600px){a{width:100%}}"
    )
    assert "color:red" in css and "@media" in css
    assert "evil" not in css and "@import" not in css


def test_page_document_enforces_menu_integrity_and_preserves_languages():
    value = validate_site(site())
    assert value["pages"][0]["en"]["html"] == "<h1>Hello</h1>"
    for mutation in ["duplicate", "missing-page", "no-home"]:
        data = copy.deepcopy(site())
        if mutation == "duplicate":
            data["pages"].append(copy.deepcopy(data["pages"][0]))
        elif mutation == "missing-page":
            data["menu"][0]["page_id"] = "outside"
        else:
            data["pages"][0]["slug"] = "about"
        with pytest.raises(ValidationError):
            validate_site(data)
    value["branding"]["logo_url"] = "data:image/svg+xml;base64,ABCD"
    with pytest.raises(ValidationError):
        validate_site(value)


def test_rich_lesson_accepts_math_table_simulation_and_rejects_unsafe_nodes():
    document = {
        "type": "doc",
        "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "A lesson"}]},
            {"type": "blockMath", "attrs": {"latex": "E=mc^2"}},
            {"type": "simulation", "attrs": {"amplitude": 1, "frequency": 2}},
            {
                "type": "table",
                "content": [
                    {
                        "type": "tableRow",
                        "content": [
                            {
                                "type": "tableCell",
                                "attrs": {"colspan": 1, "rowspan": 1, "colwidth": None},
                                "content": [{"type": "paragraph"}],
                            }
                        ],
                    }
                ],
            },
        ],
    }
    saved = LessonWrite(
        title="Lesson",
        document=document,
        translations={"en": {"content": "English", "document": document}},
    )
    assert saved.document == document
    for unsafe in [
        {"type": "script"},
        {"type": "image", "attrs": {"src": "javascript:alert(1)"}},
        {"type": "simulation", "attrs": {"frequency": 100}},
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "x",
                    "marks": [{"type": "link", "attrs": {"href": "javascript:alert(1)"}}],
                }
            ],
        },
    ]:
        with pytest.raises(ValueError):
            validate_lesson_document({"type": "doc", "content": [unsafe]})
    with pytest.raises(ValueError):
        validate_lesson_document([])


def test_legacy_puck_workspaces_still_validate_and_editor_manifest_is_metadata_only():
    old = {
        "root": {"props": {}},
        "content": [
            {"type": "Text", "props": {"id": "one", "title": "Legacy", "body": "Preserved"}}
        ],
    }
    assert WorkspaceUpdate(name="Legacy", slug="legacy", revision=1, data=old).data == old
    from pathlib import Path

    manifest = ExtensionManifest.model_validate_json(
        Path("extensions/examples/learning-tools/manifest.json").read_text()
    )
    assert manifest.editor_contributions[0].license == "commercial"
