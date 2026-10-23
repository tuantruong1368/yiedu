"""Inspect local JSON metadata only. Never import, extract, install or execute package code."""

import argparse
import sys
from pathlib import Path

from pydantic import ValidationError
from yiedu.extensions.manifest import ExtensionManifest

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("manifest", type=Path)
parser.add_argument("--core", help="Optional stable x.y.z version; requires --extension-api")
parser.add_argument("--extension-api", help="Optional stable x.y.z version; requires --core")
args = parser.parse_args()
if bool(args.core) != bool(args.extension_api):
    parser.error("Provide both --core and --extension-api")
try:
    if args.manifest.stat().st_size > 65536:
        raise ValueError("Manifest exceeds 64 KiB")
    manifest = ExtensionManifest.model_validate_json(args.manifest.read_bytes())
    if args.core:
        manifest.require_compatibility(args.core, args.extension_api)
except (OSError, ValidationError, ValueError) as exc:
    print(f"INVALID: {exc}", file=sys.stderr)
    sys.exit(1)
print(f"VALID METADATA: {manifest.package_id}@{manifest.version} ({manifest.kind})")
print("Not installed. Signature, artifact, license and runtime safety have NOT been verified.")
