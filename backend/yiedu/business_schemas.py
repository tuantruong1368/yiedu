"""Bounded, strict payloads for commerce and platform administration."""

import re
import uuid
from typing import Literal
from urllib.parse import urlparse

from pydantic import Field, field_validator, model_validator

from yiedu.authoring import validate_site
from yiedu.product_schemas import LessonWrite, StrictModel
from yiedu.schemas import Name


class Appearance(StrictModel):
    name: Name = "YiEdu"
    color: str = "#205b4b"
    hero_background: str = "#eff5ed"
    logo_url: str = "/brand/yiedu-symbol.svg"
    headline_vi: str = Field(default="Tạo hệ thống e-learning của riêng bạn.", max_length=180)
    headline_en: str = Field(default="Create your own e-learning platform.", max_length=180)
    description_vi: str = Field(
        default=(
            "Thiết kế website, xây khóa học và kinh doanh tri thức trên một nền "
            "tảng mang thương hiệu riêng."
        ),
        max_length=1000,
    )
    description_en: str = Field(
        default=(
            "Design your website, create courses and grow your learning business "
            "with your own brand."
        ),
        max_length=1000,
    )
    hero_template: str = Field(default="yirobot", pattern=r"^[a-z][a-z0-9-]{0,99}$")
    show_pricing: bool = True
    revision: int = Field(default=1, ge=1)

    @field_validator("color", "hero_background")
    @classmethod
    def hex_color(cls, value):
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
            raise ValueError("Use #RRGGBB")
        return value

    @field_validator("logo_url")
    @classmethod
    def logo(cls, value):
        if value.startswith("/brand/") and re.fullmatch(r"/brand/[a-z0-9-]+\.svg", value):
            return value
        if len(value) > 2000 or urlparse(value).scheme != "https":
            raise ValueError("Logo must use HTTPS or a bundled /brand/ asset")
        return value


class TemplateWrite(StrictModel):
    name: Name
    description: str = Field(max_length=2000)
    description_en: str = Field(default="", max_length=2000)
    category_id: str = Field(default="business", pattern=r"^[a-z][a-z0-9-]{0,49}$")
    color: str = Field(default="#205b4b", pattern=r"^#[0-9a-fA-F]{6}$")
    status: Literal["draft", "published", "archived"] = "draft"
    revision: int = Field(default=1, ge=0)
    document: dict
    courses: list[dict] = Field(default_factory=list, max_length=30)

    @field_validator("document")
    @classmethod
    def document_valid(cls, value):
        return validate_site(value)

    @field_validator("courses")
    @classmethod
    def courses_valid(cls, value):
        result = []
        for i, course in enumerate(value):
            if not isinstance(course, dict) or set(course) - {"title", "description", "lessons"}:
                raise ValueError("Invalid template course")
            if not isinstance(course.get("title"), str) or not 1 <= len(course["title"]) <= 200:
                raise ValueError("Invalid course title")
            if (
                not isinstance(course.get("description", ""), str)
                or len(course.get("description", "")) > 10000
            ):
                raise ValueError("Invalid description")
            lessons = course.get("lessons", [])
            if not isinstance(lessons, list) or len(lessons) > 30:
                raise ValueError("At most 30 lessons per course")
            result.append(
                {
                    "title": course["title"],
                    "description": course.get("description", ""),
                    "lessons": [
                        LessonWrite.model_validate({**lesson, "position": n}).model_dump(
                            exclude={"revision"}
                        )
                        for n, lesson in enumerate(lessons)
                    ],
                }
            )
        return result


class ConnectionWrite(StrictModel):
    enabled: bool = False
    config: dict = Field(default_factory=dict)
    secrets: dict = Field(default_factory=dict)
    revision: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def bounded(self):
        import json

        if len(json.dumps(self.config)) > 10000 or len(json.dumps(self.secrets)) > 10000:
            raise ValueError("Connection configuration too large")
        if any(not isinstance(v, str) or len(v) > 4000 for v in self.secrets.values()):
            raise ValueError("Secrets must be strings")
        return self


class GenerateRequest(StrictModel):
    kind: Literal["course", "template"]
    prompt: str = Field(min_length=15, max_length=6000)
    locale: Literal["vi", "en"] = "vi"
    request_key: uuid.UUID
    base_template: str = Field(default="academy", pattern=r"^[a-z][a-z0-9-]{0,99}$")


class ApplyDraft(StrictModel):
    title: Name
    template_id: str = Field(default="", pattern=r"^$|^[a-z][a-z0-9-]{0,99}$")


class OfferWrite(StrictModel):
    target_type: Literal["course", "path"]
    target_id: uuid.UUID
    mode: Literal["free", "paid"]
    price_vnd: int = Field(default=0, ge=0, le=1000000000)
    price_usd: int = Field(default=0, ge=0, le=100000000)
    active: bool = True
    revision: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def prices(self):
        if self.mode == "paid" and self.price_vnd < 1000 and self.price_usd < 100:
            raise ValueError("Paid offers require a VND or USD price")
        if self.mode == "free":
            self.price_vnd = self.price_usd = 0
        if 0 < self.price_vnd < 1000 or 0 < self.price_usd < 100:
            raise ValueError("Minimum: 1,000 VND / 1 USD")
        return self


class CheckoutWrite(StrictModel):
    offer_id: uuid.UUID | None = None
    provider: Literal["paypal", "momo", "bank"]
    request_key: uuid.UUID
    plan: Literal["starter", "growth", "scale"] | None = None
    interval: Literal["month", "year"] = "month"


class BankReview(StrictModel):
    transaction_id: str = Field(min_length=5, max_length=150, pattern=r"^[a-zA-Z0-9._:/-]+$")
    amount: int = Field(gt=0)
    note: str = Field(min_length=5, max_length=1000)


class ArchiveWrite(StrictModel):
    archived: bool


class PlanWrite(StrictModel):
    name: Name
    monthly_vnd: int = Field(ge=1000, le=100000000)
    monthly_usd: int = Field(ge=100, le=10000000)
    courses: int = Field(ge=1, le=10000)
    learners: int = Field(ge=1, le=1000000)
    ai_daily: int = Field(ge=1, le=1000)


class PlansWrite(StrictModel):
    starter: PlanWrite
    growth: PlanWrite
    scale: PlanWrite
    revision: int = Field(ge=1)
