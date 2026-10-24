"""Versioned, declarative authoring data. Imported code never grants execution rights."""

import json
import re
from urllib.parse import urlparse

import nh3
import tinycss2
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

TAGS = set(
    (
        "a abbr article aside audio b blockquote br button caption code col colgroup "
        "dd details div dl dt em figcaption figure footer form h1 h2 h3 h4 h5 h6 header "
        "hr i img input label li main nav ol p picture pre s section small source span "
        "strong sub summary sup table tbody td textarea th thead tr u ul video"
    ).split()
)
ATTRS = {
    "id",
    "class",
    "title",
    "alt",
    "src",
    "href",
    "target",
    "rel",
    "type",
    "name",
    "value",
    "placeholder",
    "width",
    "height",
    "controls",
    "autoplay",
    "loop",
    "muted",
    "poster",
    "colspan",
    "rowspan",
    "open",
    "role",
    "tabindex",
    "checked",
    "disabled",
    "required",
    "min",
    "max",
    "step",
    "loading",
    "style",
    "data-gadget",
    "data-node-id",
    "data-event",
    "data-events",
    "data-action",
    "data-target",
    "data-message",
    "data-latex",
    "data-tool",
    "data-amplitude",
    "data-frequency",
}
EVENTS = {"click", "dblclick", "mouseenter", "mouseleave", "change", "submit"}
ACTIONS = {"navigate", "scroll", "toggle", "message"}


def safe_url(value: str, image=False):
    if value.startswith(("//", "\\")) or any(ord(c) < 32 for c in value):
        return False
    if image and re.fullmatch(r"data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+", value):
        return len(value) <= 300000
    return value.startswith(("/", "#")) or urlparse(value).scheme == "https" or value == ""


def _safe_tokens(tokens):
    for token in tokens:
        kind = token.type
        if kind == "error":
            return False
        if kind == "url" and not safe_url(token.value, True):
            return False
        if kind == "function":
            if token.lower_name in {"expression", "var", "attr"}:
                # No attribute-dependent network requests or hidden CSS variable payloads.
                if token.lower_name != "var":
                    return False
            if token.lower_name == "url":
                value = tinycss2.serialize(token.arguments).strip().strip("\"'")
                if not safe_url(value, True):
                    return False
            if not _safe_tokens(token.arguments):
                return False
        if hasattr(token, "content") and token.content and not _safe_tokens(token.content):
            return False
    return True


def clean_declarations(source):
    out = []
    for item in tinycss2.parse_declaration_list(source, skip_comments=True, skip_whitespace=True):
        if item.type != "declaration" or item.lower_name.startswith(("-moz-binding", "behavior")):
            continue
        if _safe_tokens(item.value):
            out.append(item)
    return tinycss2.serialize(out)


def clean_css(source):
    out = []
    for rule in tinycss2.parse_stylesheet(source, skip_comments=True, skip_whitespace=True):
        if rule.type == "qualified-rule":
            out.append(
                tinycss2.serialize(rule.prelude) + "{" + clean_declarations(rule.content) + "}"
            )
        elif rule.type == "at-rule" and rule.lower_at_keyword == "media" and rule.content:
            out.append(
                "@media "
                + tinycss2.serialize(rule.prelude)
                + "{"
                + clean_css(tinycss2.serialize(rule.content))
                + "}"
            )
    return "".join(out)


def clean_html(source):
    def attribute(tag, name, value):
        if name not in ATTRS and not name.startswith("aria-"):
            return None
        if name in {"href", "src", "poster"} and not safe_url(value, name != "href"):
            return None
        if name == "style":
            return clean_declarations(value)
        if name == "data-events":
            try:
                events = json.loads(value)
                if not isinstance(events, list) or len(events) > 8:
                    return None
                for event in events:
                    if not isinstance(event, dict) or set(event) - {
                        "event",
                        "action",
                        "target",
                        "message",
                    }:
                        return None
                    if event.get("event") not in EVENTS or event.get("action") not in ACTIONS:
                        return None
                    if any(not isinstance(v, str) or len(v) > 2000 for v in event.values()):
                        return None
                    target = event.get("target", "")
                    if event["action"] == "navigate" and not safe_url(target):
                        return None
                return json.dumps(events)
            except ValueError, TypeError:
                return None
        if name == "data-event" and value not in EVENTS:
            return None
        if name == "data-action" and value not in ACTIONS:
            return None
        if name == "data-target" and not safe_url(value) and not re.fullmatch(r"[\w-]+", value):
            return None
        if name == "target":
            return "_blank" if value == "_blank" else None
        return value

    return nh3.clean(
        source,
        tags=TAGS,
        attributes={"*": (ATTRS - {"rel"}) | {"aria-label", "aria-hidden"}},
        attribute_filter=attribute,
        url_schemes={"https", "data"},
        clean_content_tags={"script", "style", "iframe", "object", "embed"},
        link_rel="noopener noreferrer",
    )


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Localized(Strict):
    vi: str = Field(default="", max_length=200)
    en: str = Field(default="", max_length=200)


class Source(Strict):
    html: str = Field(default="", max_length=150000)
    css: str = Field(default="", max_length=150000)

    @field_validator("html")
    @classmethod
    def sanitize_html(cls, value):
        return clean_html(value)

    @field_validator("css")
    @classmethod
    def sanitize_css(cls, value):
        return clean_css(value)


class Page(Strict):
    id: str = Field(pattern=r"^[a-zA-Z0-9-]{1,64}$")
    slug: str = Field(pattern=r"^([a-z0-9]+(-[a-z0-9]+)*)?$", max_length=63)
    title: Localized
    vi: Source
    en: Source


class Menu(Strict):
    id: str = Field(pattern=r"^[a-zA-Z0-9-]{1,64}$")
    page_id: str
    label: Localized


class Branding(Strict):
    text: str = Field(default="", max_length=100)
    logo_url: str = Field(default="", max_length=300000)
    color: str = Field(default="#215d4c", pattern=r"^#[0-9a-fA-F]{6}$")
    variant: str = Field(default="rounded", pattern=r"^(rounded|circle|square)$")

    @field_validator("logo_url")
    @classmethod
    def safe_logo(cls, value):
        if not safe_url(value, True) or (value and value.startswith(("/", "#"))):
            raise ValueError("Logo requires HTTPS or a PNG/JPEG/WebP/GIF data image")
        return value


class SiteDocument(Strict):
    schema_version: str = Field(pattern=r"^2\.0$")
    engine: str = Field(pattern=r"^grapesjs$")
    default_locale: str = Field(default="vi", pattern=r"^(vi|en)$")
    branding: Branding = Field(default_factory=Branding)
    pages: list[Page] = Field(min_length=1, max_length=20)
    menu: list[Menu] = Field(default_factory=list, max_length=30)

    @model_validator(mode="after")
    def coherent(self):
        ids = [page.id for page in self.pages]
        slugs = [page.slug for page in self.pages]
        if len(ids) != len(set(ids)) or len(slugs) != len(set(slugs)) or "" not in slugs:
            raise ValueError("Pages require unique IDs/slugs and exactly one homepage")
        if any(item.page_id not in ids for item in self.menu):
            raise ValueError("Menu references a missing page")
        if len({item.id for item in self.menu}) != len(self.menu):
            raise ValueError("Menu IDs must be unique")
        return self


def validate_site(value):
    if len(json.dumps(value)) > 1500000:
        raise ValueError("Site document exceeds 1.5MB")
    return SiteDocument.model_validate(value).model_dump()


def validate_lesson_document(value):
    if value is None:
        return None
    if len(json.dumps(value)) > 300000:
        raise ValueError("Lesson document exceeds 300KB")
    nodes = {
        "doc",
        "paragraph",
        "text",
        "heading",
        "bulletList",
        "orderedList",
        "listItem",
        "blockquote",
        "codeBlock",
        "hardBreak",
        "horizontalRule",
        "table",
        "tableRow",
        "tableCell",
        "tableHeader",
        "image",
        "youtube",
        "taskList",
        "taskItem",
        "inlineMath",
        "blockMath",
        "simulation",
        "callout",
    }
    marks = {"bold", "italic", "strike", "underline", "code", "link", "superscript", "subscript"}
    count = 0

    def walk(node, depth=0):
        nonlocal count
        count += 1
        if depth > 30 or count > 5000 or not isinstance(node, dict):
            raise ValueError("Invalid/oversized lesson tree")
        if node.get("type") not in nodes or set(node) - {
            "type",
            "attrs",
            "text",
            "content",
            "marks",
        }:
            raise ValueError("Unknown lesson node")
        attrs = node.get("attrs", {})
        if not isinstance(attrs, dict):
            raise ValueError("Invalid attributes")
        allowed = {
            "level",
            "language",
            "start",
            "checked",
            "colspan",
            "rowspan",
            "colwidth",
            "src",
            "alt",
            "title",
            "width",
            "height",
            "latex",
            "amplitude",
            "frequency",
            "message",
            "textAlign",
        }
        if set(attrs) - allowed:
            raise ValueError("Unknown lesson attributes")
        for k, v in attrs.items():
            if k == "src" and (not isinstance(v, str) or not safe_url(v, True)):
                raise ValueError("Unsafe media URL")
            if isinstance(v, (dict, list)) and k != "colwidth":
                raise ValueError("Invalid nested attribute")
            if k in {"amplitude", "frequency"} and (
                not isinstance(v, (int, float)) or not 0.1 <= v <= 10
            ):
                raise ValueError("Simulation parameter out of range")
            if k == "latex" and (not isinstance(v, str) or len(v) > 4000):
                raise ValueError("Invalid formula")
        if node.get("type") == "youtube" and not re.fullmatch(
            r"https://(www\.)?(youtube\.com/(watch\?v=|embed/)|youtu\.be/)[\w?=&-]+",
            attrs.get("src", ""),
        ):
            raise ValueError("Only YouTube URLs are allowed")
        if not isinstance(node.get("marks", []), list):
            raise ValueError("Invalid marks")
        for mark in node.get("marks", []):
            if not isinstance(mark, dict) or mark.get("type") not in marks:
                raise ValueError("Unknown mark")
            if mark.get("type") == "link" and not safe_url(mark.get("attrs", {}).get("href", "")):
                raise ValueError("Unsafe lesson link")
        if "text" in node and not isinstance(node["text"], str):
            raise ValueError("Invalid text")
        if not isinstance(node.get("content", []), list):
            raise ValueError("Invalid content")
        for child in node.get("content", []):
            walk(child, depth + 1)

    if not isinstance(value, dict) or value.get("type") != "doc":
        raise ValueError("Expected a Tiptap doc")
    walk(value)
    return value
