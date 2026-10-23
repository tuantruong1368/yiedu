"""Destructive migration round-trip on the explicitly named yiedu_test DB only."""

import os
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.engine import make_url

root = Path(__file__).resolve().parents[1]
load_dotenv(root / ".env")
url = make_url(os.environ["DATABASE_URL"]).set(database="yiedu_test")
if url.get_backend_name() != "postgresql":
    sys.exit("PostgreSQL required")
print("Testing only the yiedu_test database; do not store real data there.")
env = dict(
    os.environ,
    DATABASE_URL=url.render_as_string(hide_password=False),
    TEST_DATABASE_URL=url.render_as_string(hide_password=False),
)
for command in [
    ["alembic", "upgrade", "head"],
    ["alembic", "check"],
    ["alembic", "downgrade", "base"],
    ["alembic", "upgrade", "head"],
    [sys.executable, "-m", "pytest", "-q"],
]:
    subprocess.run(command, cwd=root, env=env, check=True)
