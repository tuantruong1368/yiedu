"""Run only against an isolated PostgreSQL DB: TEST_DATABASE_URL=... pytest -m integration."""

import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete
from sqlalchemy.orm import Session
from yiedu.config import get_settings
from yiedu.db import get_session
from yiedu.main import app
from yiedu.models import Course, Tenant

pytestmark = pytest.mark.integration


def test_tenant_course_flow():
    url = os.getenv("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL is required; use a dedicated migrated test database")
    engine = create_engine(url)
    ids = []

    def session_override():
        with Session(engine) as db:
            yield db

    app.dependency_overrides[get_session] = session_override
    headers = {"X-Admin-Key": get_settings().admin_api_key.get_secret_value()}
    try:
        with TestClient(app) as client:
            for name in ["a", "b"]:
                payload = {"slug": f"test-{name}-{uuid.uuid4().hex[:10]}", "name": name}
                response = client.post("/api/v1/tenants", json=payload, headers=headers)
                assert response.status_code == 201, response.text
                ids.append(response.json()["id"])
                assert (
                    client.post("/api/v1/tenants", json=payload, headers=headers).status_code == 409
                )
            payload = {"slug": "intro", "title": "Introduction"}
            endpoint = f"/api/v1/tenants/{ids[0]}/courses"
            assert client.post(endpoint, json=payload, headers=headers).status_code == 201
            assert client.post(endpoint, json=payload, headers=headers).status_code == 409
            assert len(client.get(endpoint, headers=headers).json()) == 1
            other = f"/api/v1/tenants/{ids[1]}/courses"
            assert client.get(other, headers=headers).json() == []
            assert client.post(other, json=payload, headers=headers).status_code == 201
            missing = f"/api/v1/tenants/{uuid.uuid4()}/courses"
            assert client.get(missing, headers=headers).status_code == 404
            assert client.get(endpoint + "?limit=101", headers=headers).status_code == 422
            assert client.get("/health/ready").status_code == 200
    finally:
        app.dependency_overrides.clear()
        with Session(engine) as db:
            uuids = [uuid.UUID(value) for value in ids]
            db.execute(delete(Course).where(Course.tenant_id.in_(uuids)))
            db.execute(delete(Tenant).where(Tenant.id.in_(uuids)))
            db.commit()
        engine.dispose()
