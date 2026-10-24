"""Portable content projects. Only declarative, first-party tool data is accepted."""

import json
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Slide(Strict):
    id: str = Field(pattern=r"^[a-zA-Z0-9-]{1,64}$")
    title: str = Field(max_length=200)
    body: str = Field(default="", max_length=8000)
    notes: str = Field(default="", max_length=8000)
    duration: float = Field(default=8, ge=1, le=300)


class Presentation(Strict):
    version: Literal["1.0"] = "1.0"
    theme: str = Field(default="#215d4c", pattern=r"^#[0-9a-fA-F]{6}$")
    slides: list[Slide] = Field(min_length=1, max_length=80)
    source_url: str = Field(default="", max_length=2000, pattern=r"^(https://[^\s\\]+)?$")

    @model_validator(mode="after")
    def unique_slides(self):
        if len({s.id for s in self.slides}) != len(self.slides):
            raise ValueError("Slide IDs must be unique")
        return self


SIMULATION_RANGES = {
    "differential-drive": {"left": (-2, 2), "right": (-2, 2), "track": (0.1, 2)},
    "pid": {"kp": (0, 8), "ki": (0, 4), "kd": (0, 4), "target": (0.1, 10)},
    "sorting": {"size": (4, 24), "speed": (1, 10)},
    "scaling": {"parallel": (0, 0.99), "workers": (1, 64)},
}


class Simulation(Strict):
    version: Literal["1.0"] = "1.0"
    model: Literal["differential-drive", "pid", "sorting", "scaling"]
    parameters: dict[str, float] = Field(default_factory=dict)

    @model_validator(mode="after")
    def supported_parameters(self):
        ranges = SIMULATION_RANGES[self.model]
        for key, value in self.parameters.items():
            if key not in ranges or not ranges[key][0] <= value <= ranges[key][1]:
                raise ValueError("Unsupported simulation parameter/range")
        return self


def validate_project(kind, data):
    if not isinstance(kind, str) or not isinstance(data, dict):
        raise ValueError("Invalid project kind/data")
    if len(json.dumps(data, allow_nan=False)) > 250000:
        raise ValueError("Project exceeds 250KB")
    model = Simulation if kind == "simulation" else Presentation
    if kind not in {"slides", "video", "simulation"}:
        raise ValueError("Unknown studio tool")
    return model.model_validate(data).model_dump()


class AssetWrite(Strict):
    title: str = Field(min_length=1, max_length=200)
    kind: Literal["slides", "video", "simulation"]
    locale: Literal["vi", "en"] = "vi"
    data: dict
    revision: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def valid_data(self):
        self.title = self.title.strip()
        if not self.title:
            raise ValueError("A project title is required")
        self.data = validate_project(self.kind, self.data)
        return self
