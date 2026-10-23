"""Ensure checked-in contract schema and metadata examples match the current validator."""

import json
import sys
from pathlib import Path

from yiedu.extensions.manifest import ExtensionManifest

root = Path(__file__).resolve().parents[1]
schema = root / "contracts/extension-manifest.schema.json"
if json.loads(schema.read_text()) != ExtensionManifest.model_json_schema():
    sys.exit("Manifest schema drift: regenerate JSON Schema from ExtensionManifest")
examples = list((root / "extensions/examples").glob("*/manifest.json"))
if len(examples) < 3:
    sys.exit("Expected template, component and plugin examples")
for example in examples:
    ExtensionManifest.model_validate_json(example.read_bytes())
print(f"Manifest schema and {len(examples)} metadata examples: OK (not runtime validation)")
