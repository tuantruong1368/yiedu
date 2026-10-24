import re

import pytest
from yiedu.site_render import Fragment, render_site


def document():
    return {
        "default_locale": "vi",
        "branding": {"text": "School"},
        "pages": [
            {
                "id": "home",
                "slug": "",
                "title": {"vi": "Trang chủ", "en": "Home"},
                "vi": {
                    "html": '<h1>Học tập</h1><a data-template-link="programs">Study</a>'
                    '<a href="#map">Map</a><section data-gadget="yiedu.courses">'
                    '<div class="wrap"><div data-template-preview="true">OLD</div></div>'
                    "</section>",
                    "css": "h1{color:#23776d}",
                },
                "en": {"html": "", "css": ""},
            },
            {
                "id": "programs",
                "slug": "training",
                "title": {"vi": "Học", "en": "Study"},
                "vi": {"html": '<section id="map">Pathway</section>', "css": ""},
                "en": {"html": '<section id="map">Pathway</section>', "css": ""},
            },
        ],
    }


def test_server_document_rewrites_routes_and_injects_escaped_course_content():
    data = document()
    courses = [
        {
            "id": "course-1",
            "title": '<img src=x onerror="bad">',
            "description": "A&B",
            "translations": {"en": {"title": "English title"}},
        }
    ]
    html, csp = render_site(data, courses, "school")
    assert 'href="/t/school/p/training"' in html
    assert 'href="/t/school/p/training#map"' in html
    assert 'href="/t/school/learn?course=course-1"' in html
    assert "&lt;img" in html and "A&amp;B" in html and "OLD" not in html
    root = Fragment(html).root
    assert sum(node.attrs.get("class") == "yd-course-grid" for node in root.walk()) == 1
    assert "default-src 'none'" in csp and "form-action 'none'" in csp
    nonce = re.search(r'<script nonce="([\w-]+)"', html).group(1)
    assert f"'nonce-{nonce}'" in csp
    another, _ = render_site(data, courses, "school")
    assert nonce not in another


def test_fallback_css_breakout_prevention_and_missing_pages():
    data = document()
    data["pages"][0]["vi"]["css"] = "body{color:red}</style><script>bad</script>"
    html, _ = render_site(data, [], "school", locale="en")
    assert "Học tập" in html and "</style><script>bad" not in html
    with pytest.raises(KeyError):
        render_site(data, [], "school", page_slug="missing")
