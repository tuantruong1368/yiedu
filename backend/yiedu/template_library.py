"""Versioned original learning units and public template metadata; no remote code/content fetch."""

import copy
import json
from functools import lru_cache
from pathlib import Path

from yiedu.authoring import validate_lesson_document
from yiedu.learning_media import guided_simulation, media_node, presentation_for

ROOT = Path(__file__).with_name("content")


@lru_cache
def library():
    modules = json.loads((ROOT / "modules.json").read_text())
    templates = json.loads((ROOT / "templates.json").read_text())
    sources = json.loads((ROOT / "sources.json").read_text())
    return {
        "modules": {x["id"]: x for x in modules},
        "templates": {x["id"]: x for x in templates},
        "sources": sources,
    }


def get_template(key):
    return copy.deepcopy(library()["templates"][key])


def get_module(key):
    return copy.deepcopy(library()["modules"][key])


def catalog():
    return [
        {
            **{k: v for k, v in t.items() if k not in {"module_ids", "semesters"}},
            "course_count": len(t["module_ids"]),
            "lesson_count": 4 * len(t["module_ids"]),
            "semester_count": len(t["semesters"]),
            "page_count": 5,
        }
        for t in library()["templates"].values()
    ]


def paragraph(text):
    return {"type": "paragraph", "content": [{"type": "text", "text": str(text)}]}


def heading(text):
    return {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": text}]}


def listing(items):
    return {
        "type": "orderedList",
        "attrs": {"start": 1},
        "content": [{"type": "listItem", "content": [paragraph(x)]} for x in items],
    }


def lessons_for(module_id):
    m = get_module(module_id)
    labels = {
        "vi": [
            "Nguyên lý và cách hiểu",
            "Ví dụ có lời giải",
            "Thực hành và sản phẩm",
            "Tự đánh giá và đáp án",
        ],
        "en": [
            "Principles and reasoning",
            "Worked example",
            "Practice and deliverable",
            "Self-check and solutions",
        ],
    }
    result = []
    for index in range(4):
        versions = {}
        for lang in ["vi", "en"]:
            title = labels[lang][index] + " · " + m["title"][lang]
            nodes = [heading(title)]
            if index == 0:
                nodes += [paragraph(m["concept"][lang]), heading("Reading / Đọc mở rộng")]
                for ref in m["sources"]:
                    source = library()["sources"][ref]
                    nodes.append(
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": source["title"],
                                    "marks": [
                                        {
                                            "type": "link",
                                            "attrs": {"href": source["url"], "target": "_blank"},
                                        }
                                    ],
                                }
                            ],
                        }
                    )
                nodes.append(
                    paragraph(
                        "Đọc học liệu gốc để đào sâu; đây là bài học cô đọng của YiEdu, "
                        "không phải bản sao giáo trình."
                        if lang == "vi"
                        else "Use the original reading to study further. "
                        "This is a compact YiEdu learning "
                        "unit, not a reproduction of the referenced textbook."
                    )
                )
            elif index == 1:
                nodes += [paragraph(m["example"][lang])]
                if m["code"]:
                    nodes += [
                        {
                            "type": "codeBlock",
                            "attrs": {"language": "python"},
                            "content": [{"type": "text", "text": m["code"]}],
                        },
                        heading("Kết quả mong đợi" if lang == "vi" else "Expected output"),
                        paragraph(m["code_output"]),
                    ]
                if module_id in {"control", "signals"}:
                    nodes.append({"type": "simulation", "attrs": {"amplitude": 1, "frequency": 1}})
            elif index == 2:
                nodes += [
                    listing(m["lab"][lang]),
                    heading("Bằng chứng cần nộp" if lang == "vi" else "Evidence to submit"),
                    paragraph(
                        "Nộp cách chạy, đầu vào, kết quả, "
                        "một tình huống thất bại và giải thích. Không chỉ nộp ảnh chụp."
                        if lang == "vi"
                        else "Submit commands, inputs, outputs, one failure case "
                        "and an explanation, rather than only a screenshot."
                    ),
                ]
            else:
                nodes += [
                    listing(m["questions"][lang]),
                    heading("Đáp án tham khảo" if lang == "vi" else "Reference solutions"),
                    listing(m["answers"][lang]),
                    paragraph(
                        "Rubric gợi ý: đúng nguyên lý 4/10; bằng chứng thực hành 3/10; "
                        "giải thích giới hạn 2/10; tái lập 1/10. Cần người có chuyên môn "
                        "review để kết luận năng lực."
                        if lang == "vi"
                        else "Suggested rubric: correctness 4/10, practical evidence 3/10, "
                        "limitations 2/10, reproducibility 1/10. Competence requires "
                        "qualified review, not completion clicks alone."
                    ),
                ]
            if index == 0:
                nodes.append(media_node("slides", title, presentation_for(m, lang)))
            elif index == 1:
                nodes.append(
                    heading(
                        "Xem bài giảng theo cảnh"
                        if lang == "vi"
                        else "Scene-based lesson presentation"
                    )
                )
                nodes.append(
                    paragraph(
                        "Bật đọc lời giảng hoặc mở ghi chú, dừng để làm bài tập. Đây là "
                        "bài giảng theo cảnh, không phải video người giảng quay sẵn."
                        if lang == "vi"
                        else "Enable narration or open the notes, and pause to practice. "
                        "This is a scene-based lesson, not a prerecorded instructor video."
                    )
                )
                nodes.append(media_node("video", title, presentation_for(m, lang, video=True)))
            elif index == 2:
                nodes.extend(guided_simulation(module_id, lang))
            document = validate_lesson_document({"type": "doc", "content": nodes})
            versions[lang] = {
                "title": title[:200],
                "document": document,
                "content": plain_text(document),
            }
        result.append(
            {
                "title": versions["vi"]["title"],
                "position": index,
                "content": versions["vi"]["content"],
                "document": versions["vi"]["document"],
                "translations": {"en": versions["en"]},
            }
        )
    return result


def plain_text(node):
    if node.get("type") == "text":
        return node["text"]
    if node.get("type") == "studioAsset":
        attrs = node["attrs"]
        payload = attrs["payload"]
        if attrs["kind"] == "simulation":
            return "[Interactive model / Mô hình tương tác: " + payload["model"] + "]"
        return "\n".join(
            s["title"] + "\n" + s["body"] + "\n" + s["notes"] for s in payload["slides"]
        )
    if node.get("type") == "simulation":
        return "[Mô phỏng tương tác trên web / Interactive simulation on web]"
    return "\n".join(filter(None, (plain_text(x) for x in node.get("content", []))))


def curriculum(template_id):
    t = get_template(template_id)
    result = []
    for i, key in enumerate(t["module_ids"]):
        m = get_module(key)
        semester = next((n + 1 for n, group in enumerate(t["semesters"]) if key in group), None)
        result.append(
            {
                "id": key,
                "title": m["title"]["vi"],
                "description": m["concept"]["vi"],
                "translations": {
                    "en": {"title": m["title"]["en"], "description": m["concept"]["en"]}
                },
                "curriculum_meta": {
                    "module_id": key,
                    "template_id": template_id,
                    "sequence": i,
                    "semester": semester,
                    "year": (semester + 1) // 2 if semester else None,
                    "estimated_hours": m["estimated_hours"],
                    "content_depth": m["content_depth"],
                    "review_status": m["review_status"],
                    "sources": [library()["sources"][s] for s in m["sources"]],
                },
                "lesson_count": 4,
            }
        )
    return result
