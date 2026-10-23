"""Check local Markdown links and required phase files using only Python stdlib."""

import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
errors = []
for source in [root / "README.md", *(root / "handbook").rglob("*.md")]:
    text = source.read_text(encoding="utf-8")
    for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", text):
        target = target.split("#")[0]
        if not target or "://" in target or target.startswith("mailto:"):
            continue
        if not (source.parent / target).exists():
            errors.append(f"{source.relative_to(root)}: missing {target}")
for phase in range(10):
    matches = list((root / "handbook/phases").glob(f"p{phase}-*/index.md"))
    if len(matches) != 1:
        errors.append(f"P{phase}: expected one phase index")
for name in ["charter.md", "requirements.md", "architecture.md", "backlog.md", "status.md"]:
    if not (root / "handbook/product" / name).exists():
        errors.append(f"Missing product/{name}")
if errors:
    print("\n".join(errors))
    sys.exit(1)
print("Documentation links and P0–P9 structure: OK")
