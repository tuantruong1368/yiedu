import copy

import pytest
from yiedu.authoring import validate_lesson_document
from yiedu.learning_media import presentation_for, simulation_for
from yiedu.studio_schema import AssetWrite, validate_project
from yiedu.template_library import get_module, lessons_for


def project():
    return presentation_for(get_module("python"), "vi")


def test_project_and_snapshot_contracts():
    data = project()
    assert len(data["slides"]) >= 7
    assert AssetWrite(title="Lesson slides", kind="slides", data=data).data == data
    for kind, payload in [
        ("slides", data),
        ("video", data),
        ("simulation", simulation_for("mobile-robots")),
    ]:
        value = {
            "type": "doc",
            "content": [
                {
                    "type": "studioAsset",
                    "attrs": {
                        "title": "Learning media",
                        "kind": kind,
                        "payload": payload,
                    },
                }
            ],
        }
        assert validate_lesson_document(value) == value


@pytest.mark.parametrize(
    "kind,payload",
    [
        ([], {}),
        ("slides", []),
        ("javascript", {}),
        ("simulation", {"model": "iframe", "parameters": {}}),
        ("simulation", {"model": "pid", "parameters": {"kp": 99}}),
        ("simulation", {"model": "pid", "parameters": {"kp": float("nan")}}),
        ("simulation", {"model": "sorting", "parameters": {"script": 1}}),
    ],
)
def test_untrusted_tool_data_rejected(kind, payload):
    with pytest.raises(ValueError):
        validate_project(kind, payload)


def test_duplicate_scenes_and_active_urls_rejected():
    data = project()
    data["slides"].append(copy.deepcopy(data["slides"][0]))
    with pytest.raises(ValueError):
        validate_project("video", data)
    data = project()
    data["source_url"] = "javascript:alert(1)"
    with pytest.raises(ValueError):
        validate_project("video", data)


def test_robot_and_software_lessons_have_editable_media_and_guided_experiments():
    for module in ["mobile-robots", "control", "algorithms", "software-architecture"]:
        lessons = lessons_for(module)
        for lang in ["vi", "en"]:
            localized = [item if lang == "vi" else item["translations"][lang] for item in lessons]
            assert any(
                n["type"] == "studioAsset" and n["attrs"]["kind"] == "slides"
                for n in localized[0]["document"]["content"]
            )
            assert any(
                n["type"] == "studioAsset" and n["attrs"]["kind"] == "video"
                for n in localized[1]["document"]["content"]
            )
            assert any(
                n["type"] == "studioAsset" and n["attrs"]["kind"] == "simulation"
                for n in localized[2]["document"]["content"]
            )
