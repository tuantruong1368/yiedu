"""Experimental v0.1 metadata contract; validation does NOT make a package trusted."""

import re
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

StableVersion = Annotated[
    str, StringConstraints(pattern=r"^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$")
]
PackageId = Annotated[
    str, StringConstraints(pattern=r"^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$", max_length=120)
]


def version_tuple(value: str) -> tuple[int, int, int]:
    """Strict stable x.y.z subset; prerelease/build/range syntax intentionally unsupported."""
    if not re.fullmatch(r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)", value):
        raise ValueError("Expected stable version x.y.z without prerelease or leading zeroes")
    return tuple(int(part) for part in value.split("."))


class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class VersionRange(ContractModel):
    min_inclusive: StableVersion
    max_exclusive: StableVersion

    @model_validator(mode="after")
    def ordered_range(self):
        if version_tuple(self.min_inclusive) >= version_tuple(self.max_exclusive):
            raise ValueError("Version range must be nonempty: minimum < maximum")
        return self

    def contains(self, version: str) -> bool:
        return (
            version_tuple(self.min_inclusive)
            <= version_tuple(version)
            < version_tuple(self.max_exclusive)
        )


class Dependency(ContractModel):
    package_id: PackageId
    versions: VersionRange


class EditorContribution(ContractModel):
    id: Annotated[str, StringConstraints(pattern=r"^[a-z][a-z0-9-]{0,63}$")]
    slot: Literal["page-gadget", "lesson-tool", "studio-tool"]
    api_version: Literal["1.0.0"]
    export_name: Annotated[str, StringConstraints(pattern=r"^[A-Za-z][A-Za-z0-9_]{0,99}$")]
    license: Literal["free", "commercial"] = "free"
    props_schema: dict = Field(default_factory=dict)


class ExtensionManifest(ContractModel):
    schema_version: Literal["0.1"]
    package_id: PackageId
    kind: Literal["template", "component", "plugin", "block"]
    version: StableVersion
    display_name: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
    ]
    core: VersionRange
    extension_api: VersionRange
    surfaces: list[Literal["web", "admin", "mobile"]] = Field(min_length=1, max_length=3)
    capabilities: list[
        Literal[
            "pages:read",
            "pages:write",
            "courses:read",
            "courses:write",
            "learning:read",
            "notifications:send",
        ]
    ] = Field(default_factory=list, max_length=6)
    dependencies: list[Dependency] = Field(default_factory=list, max_length=50)
    editor_contributions: list[EditorContribution] = Field(default_factory=list, max_length=30)
    portable: bool
    data_schema_version: StableVersion

    @model_validator(mode="after")
    def unique_values(self):
        if len(set(self.surfaces)) != len(self.surfaces):
            raise ValueError("Duplicate surfaces")
        if len(set(self.capabilities)) != len(self.capabilities):
            raise ValueError("Duplicate capabilities")
        contributions = [item.id for item in self.editor_contributions]
        if len(contributions) != len(set(contributions)):
            raise ValueError("Duplicate editor contribution IDs")
        ids = [dependency.package_id for dependency in self.dependencies]
        if len(set(ids)) != len(ids):
            raise ValueError("Duplicate dependencies")
        if self.package_id in ids:
            raise ValueError("A package cannot depend on itself")
        return self

    def require_compatibility(self, core: str, extension_api: str):
        if not self.core.contains(core) or not self.extension_api.contains(extension_api):
            raise ValueError("Incompatible core or extension API version")
