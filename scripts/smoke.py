"""Create sample tenant/course through the local API; no production data."""

import os
import sys
import uuid
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
key = os.environ.get("ADMIN_API_KEY")
if not key or key.startswith("replace-with"):
    sys.exit("Set ADMIN_API_KEY in .env first")
with httpx.Client(base_url="http://127.0.0.1:8000", headers={"X-Admin-Key": key}) as client:
    client.get("/health/ready").raise_for_status()
    suffix = uuid.uuid4().hex[:8]
    tenant = client.post("/api/v1/tenants", json={"slug": f"demo-{suffix}", "name": "Demo YiEdu"})
    tenant.raise_for_status()
    tenant_id = tenant.json()["id"]
    endpoint = f"/api/v1/tenants/{tenant_id}/courses"
    course = client.post(endpoint, json={"slug": "python-co-ban", "title": "Python cơ bản"})
    course.raise_for_status()
    listed = client.get(endpoint)
    listed.raise_for_status()
    assert any(row["id"] == course.json()["id"] for row in listed.json())
    print(f"PASS: tenant {tenant_id}, course {course.json()['id']}")
