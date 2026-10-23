import re
import uuid
from typing import Literal
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator

from yiedu.schemas import Name, TenantSlug


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Credentials(StrictModel):
    email: str = Field(max_length=254)
    password: str = Field(min_length=10, max_length=128)
    client: Literal["web", "native"] = "web"

    @field_validator("email")
    @classmethod
    def email_valid(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Email không hợp lệ")
        return value


class Register(Credentials):
    name: Name


class WorkspaceCreate(StrictModel):
    name: Name
    slug: TenantSlug
    template_id: Literal["academy", "creator", "technology"] = "academy"


class WorkspaceUpdate(StrictModel):
    name: Name
    slug: TenantSlug
    revision: int = Field(ge=1)
    data: dict

    @field_validator("data")
    @classmethod
    def page_valid(cls, value):
        import json

        if len(json.dumps(value)) > 100000:
            raise ValueError("Trang vượt quá giới hạn 100KB")
        blocks = value.get("content", [])
        if not isinstance(blocks, list) or len(blocks) > 50:
            raise ValueError("Tối đa 50 khối nội dung")
        allowed = {
            "Hero": {"id", "eyebrow", "title", "description", "buttonText"},
            "Text": {"id", "title", "body"},
            "Courses": {"id", "title"},
            "Stats": {"id", "first", "second", "third"},
        }
        ids = set()
        for block in blocks:
            if not isinstance(block, dict) or block.get("type") not in allowed:
                raise ValueError("Khối nội dung không được hỗ trợ")
            props = block.get("props", {})
            if not isinstance(props, dict) or set(props) - allowed[block["type"]]:
                raise ValueError("Thuộc tính khối không hợp lệ")
            if any(not isinstance(v, str) or len(v) > 10000 for v in props.values()):
                raise ValueError("Nội dung khối phải là văn bản")
            if not props.get("id") or props["id"] in ids:
                raise ValueError("Mỗi khối phải có ID duy nhất")
            ids.add(props["id"])
        return {"root": {"props": {}}, "content": blocks}


class CourseWrite(StrictModel):
    title: Name
    slug: TenantSlug
    description: str = Field(default="", max_length=10000)
    published: bool = False


class LessonWrite(StrictModel):
    title: Name
    content: str = Field(default="", max_length=100000)
    video_url: str = Field(default="", max_length=2000)
    position: int = Field(default=0, ge=0, le=10000)

    @field_validator("video_url")
    @classmethod
    def safe_url(cls, value):
        if value and urlparse(value).scheme != "https":
            raise ValueError("Video URL phải dùng HTTPS")
        return value


class PathWrite(StrictModel):
    title: Name
    course_ids: list[uuid.UUID] = Field(default_factory=list, max_length=100)

    @field_validator("course_ids")
    @classmethod
    def no_duplicates(cls, value):
        if len(value) != len(set(value)):
            raise ValueError("Lộ trình không được lặp khóa học")
        return value


class MemberWrite(StrictModel):
    email: str = Field(max_length=254)
    role: Literal["admin", "instructor", "learner"]


class ExtensionToggle(StrictModel):
    enabled: bool


class ListingWrite(StrictModel):
    manifest: dict
    description: str = Field(default="", max_length=10000)
