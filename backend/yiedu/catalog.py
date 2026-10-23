"""First-party data templates and builtin extensions; no arbitrary code loading."""

TEMPLATES = [
    {
        "id": "academy",
        "name": "Academy",
        "category": "Trung tâm đào tạo",
        "color": "#215d4c",
        "subtitle": "Kiến thức hôm nay. Khả năng ngày mai.",
        "description": "Một không gian học tập có định hướng, dành cho những bước tiến thực sự.",
    },
    {
        "id": "creator",
        "name": "Studio",
        "category": "Giảng viên độc lập",
        "color": "#a84a2b",
        "subtitle": "Chia sẻ điều bạn giỏi. Truyền cảm hứng học tập.",
        "description": "Biến kinh nghiệm của bạn thành những bài học người khác có thể áp dụng.",
    },
    {
        "id": "technology",
        "name": "Future Lab",
        "category": "Công nghệ & Robotics",
        "color": "#3449a3",
        "subtitle": "Học bằng cách tạo ra điều mới.",
        "description": "Khám phá công nghệ, thực hành qua dự án và xây năng lực của chính bạn.",
    },
]
BUILTINS = [
    {
        "package_id": "yiedu.certificates",
        "name": "Chứng nhận hoàn thành",
        "kind": "component",
        "description": "Cho phép học viên xem và in chứng nhận sau khi hoàn thành khóa học.",
    },
    {
        "package_id": "yiedu.activity-log",
        "name": "Nhật ký học tập",
        "kind": "plugin",
        "description": "Ghi sự kiện hoàn thành bài học vào nhật ký quản trị của tenant.",
    },
]


def initial_page(template_id: str) -> dict:
    item = next(x for x in TEMPLATES if x["id"] == template_id)
    return {
        "root": {"props": {}},
        "content": [
            {
                "type": "Hero",
                "props": {
                    "id": "hero",
                    "eyebrow": "KHỞI ĐẦU HÀNH TRÌNH CỦA BẠN",
                    "title": item["subtitle"],
                    "description": item["description"],
                    "buttonText": "Khám phá khóa học",
                },
            },
            {
                "type": "Text",
                "props": {
                    "id": "intro",
                    "title": "Học có mục tiêu. Tiến bộ mỗi ngày.",
                    "body": (
                        "Các khóa học và lộ trình được thiết kế để bạn học từng bước, "
                        "hiểu sâu và thực hành."
                    ),
                },
            },
            {"type": "Courses", "props": {"id": "courses", "title": "Khóa học đang mở"}},
        ],
    }
