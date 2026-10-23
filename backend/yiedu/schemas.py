import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

TenantSlug = Annotated[str, StringConstraints(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=63)]
CourseSlug = Annotated[
    str, StringConstraints(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=100)
]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class TenantCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    slug: TenantSlug
    name: Name
    branding: dict = Field(default_factory=dict)


class TenantRead(TenantCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime


class CourseCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    slug: CourseSlug
    title: Name


class CourseRead(CourseCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
