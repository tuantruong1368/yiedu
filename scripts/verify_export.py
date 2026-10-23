"""Verify checksums in an extracted local export. This is integrity checking, not authentication."""

import argparse
import hashlib
import json
from pathlib import Path


def verify(root: Path):
    root = root.resolve()
    manifest = json.loads((root / "export-manifest.json").read_text())
    if not isinstance(manifest.get("files"), dict) or len(manifest["files"]) > 1000:
        raise ValueError("Invalid manifest")
    for name, expected in manifest["files"].items():
        path = (root / name).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            raise ValueError(f"Invalid/missing path: {name}")
        if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise ValueError(f"Checksum mismatch: {name}")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    result = verify(args.directory)
    print(f"Integrity OK for tenant {result['tenant_id']}; export is not cryptographically signed.")
