"""First-party data templates and builtin extensions; no arbitrary code loading."""

from yiedu.template_library import catalog
from yiedu.template_sites import site_document

TEMPLATES = catalog()
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


def initial_page(template_id: str, name: str | None = None) -> dict:
    return site_document(template_id, name)
