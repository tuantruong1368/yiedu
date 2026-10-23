"""Move the previous Compose database to PostgreSQL 18 without deleting the old volume.

Run from the same checkout/directory and Compose project used for PostgreSQL 17.
The old volume and a private backup remain available for rollback.
"""

import argparse
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def compose(legacy=False):
    return ["docker", "compose", "-f", "compose.pg17.yaml" if legacy else "compose.yaml"]


def run(args, **kwargs):
    return subprocess.run(args, cwd=ROOT, check=True, **kwargs)


def sql(statement, legacy=False):
    command = 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "$1"'
    return run(
        compose(legacy) + ["exec", "-T", "db", "sh", "-c", command, "sql", statement],
        capture_output=True,
        text=True,
    ).stdout.strip()


def counts(legacy=False):
    tables = json.loads(
        sql(
            "SELECT COALESCE(json_agg(tablename ORDER BY tablename), '[]'::json) "
            "FROM pg_tables WHERE schemaname='public'",
            legacy,
        )
    )
    return {
        name: int(sql('SELECT count(*) FROM public."' + name.replace('"', '""') + '"', legacy))
        for name in tables
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--restore", type=Path, help="Retry restoration from an existing backup")
    args = parser.parse_args()
    if not (ROOT / ".env").exists():
        raise SystemExit("Existing .env is required; do not change database credentials.")
    run(["docker", "info"], stdout=subprocess.DEVNULL)
    run(compose() + ["stop", "web", "api", "migrate"])
    if args.restore:
        backup = args.restore.resolve()
        expected = json.loads(backup.with_suffix(".counts.json").read_text())
        if not backup.is_file() or backup.stat().st_size == 0:
            raise SystemExit("Backup is missing or empty.")
    else:
        # Keep the same Compose project name; set COMPOSE_PROJECT_NAME if previously using -p.
        run(compose(True) + ["up", "-d", "--wait", "db"])
        if sql("SHOW server_version_num", True)[:2] != "17":
            raise SystemExit("Expected PostgreSQL 17 source. No backup/restore was attempted.")
        expected = counts(True)
        if not expected:
            raise SystemExit(
                "Source has no tables. Check checkout/project name; refusing an empty migration."
            )
        folder = ROOT / "backups"
        folder.mkdir(exist_ok=True, mode=0o700)
        backup = folder / (
            "postgres17-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + ".dump"
        )
        descriptor = os.open(backup, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "wb") as handle:
            run(
                compose(True)
                + [
                    "exec",
                    "-T",
                    "db",
                    "sh",
                    "-c",
                    'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"',
                ],
                stdout=handle,
            )
        if backup.stat().st_size == 0:
            raise SystemExit("Backup is empty. PostgreSQL 17 remains available.")
        manifest = backup.with_suffix(".counts.json")
        manifest.write_text(json.dumps(expected, indent=2) + "\n")
        manifest.chmod(0o600)
        run(
            compose(True) + ["exec", "-T", "db", "pg_restore", "--list"],
            input=backup.read_bytes(),
            stdout=subprocess.DEVNULL,
        )
        print(f"Backup created: {backup.relative_to(ROOT)}", flush=True)
        run(compose(True) + ["stop", "db"])
    run(compose() + ["up", "-d", "--wait", "db"])
    if sql("SHOW server_version_num")[:2] != "18":
        raise SystemExit("Expected PostgreSQL 18 target; restoration aborted.")
    if sql("SELECT count(*) FROM pg_tables WHERE schemaname='public'") != "0":
        raise SystemExit(
            "Target has tables: refusing to overwrite. Old volume and backup are retained."
        )
    # A single transaction makes a failed restore retryable without partially imported tables.
    with backup.open("rb") as handle:
        run(
            compose()
            + [
                "exec",
                "-T",
                "db",
                "sh",
                "-c",
                "pg_restore --exit-on-error --single-transaction --no-owner --no-acl "
                '-U "$POSTGRES_USER" -d "$POSTGRES_DB"',
            ],
            stdin=handle,
        )
    if counts() != expected:
        raise SystemExit(
            "Row counts differ. Keep apps stopped and inspect the backup; do not delete volumes."
        )
    print("PostgreSQL 18 restored; all public table row counts match. Old volume retained.")
    print("Next: docker compose up --build -d")


if __name__ == "__main__":
    main()
