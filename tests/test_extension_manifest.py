"""Contract boundaries protect metadata intake; these are not installer security tests."""

import json
from pathlib import Path

import pytest
from pydantic import ValidationError
from yiedu.extensions.manifest import ExtensionManifest

ROOT = Path(__file__).resolve().parents[1]


def sample():
    return json.loads((ROOT / "extensions/examples/training-template/manifest.json").read_text())


def test_stable_version_range_boundaries():
    manifest = ExtensionManifest.model_validate(sample())
    manifest.require_compatibility("0.1.0", "0.1.0")
    manifest.require_compatibility("0.9.99", "0.1.99")
    for core, api in [("0.0.9", "0.1.0"), ("1.0.0", "0.1.0"), ("0.1.0", "0.2.0")]:
        with pytest.raises(ValueError, match="Incompatible"):
            manifest.require_compatibility(core, api)


@pytest.mark.parametrize(
    "field,value",
    [
        ("package_id", "../../core"),
        ("kind", "python-script"),
        ("version", "01.2.3"),
        ("version", "1.0.0-beta"),
        ("schema_version", "99"),
        ("portable", "true"),
        ("capabilities", ["database:all"]),
        ("surfaces", ["web", "web"]),
        ("capabilities", ["pages:read", "pages:read"]),
    ],
)
def test_rejects_unsafe_or_ambiguous_metadata(field, value):
    data = sample()
    data[field] = value
    with pytest.raises(ValidationError):
        ExtensionManifest.model_validate(data)


def test_rejects_invalid_range_self_dependency_and_unknown_fields():
    data = sample()
    data["core"]["max_exclusive"] = data["core"]["min_inclusive"]
    with pytest.raises(ValidationError, match="nonempty"):
        ExtensionManifest.model_validate(data)
    data = sample()
    data["dependencies"] = [{"package_id": data["package_id"], "versions": data["core"]}]
    with pytest.raises(ValidationError, match="itself"):
        ExtensionManifest.model_validate(data)
    data = sample()
    data["entrypoint"] = "os.system"
    with pytest.raises(ValidationError):
        ExtensionManifest.model_validate(data)


def test_all_examples_validate_from_json():
    for path in (ROOT / "extensions/examples").glob("*/manifest.json"):
        ExtensionManifest.model_validate_json(path.read_bytes())
