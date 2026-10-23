from fastapi.testclient import TestClient
from yiedu.config import get_settings
from yiedu.main import app


def test_health_and_admin_boundary():
    with TestClient(app) as client:
        assert client.get("/health/live").json() == {"status": "ok"}
        assert client.get("/api/v1/tenants").status_code == 401
        assert client.get("/api/v1/tenants", headers={"X-Admin-Key": "wrong"}).status_code == 401


def test_validation_rejects_blank_names_and_invalid_slugs():
    import pytest
    from pydantic import ValidationError
    from yiedu.schemas import TenantCreate

    for payload in [{"slug": "Bad Slug", "name": "Demo"}, {"slug": "demo", "name": "  "}]:
        with pytest.raises(ValidationError):
            TenantCreate(**payload)


def test_default_example_key_is_rejected(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("ADMIN_API_KEY", "replace-with-a-random-local-key-at-least-32-chars")
    try:
        import pytest

        with pytest.raises(ValueError, match="ADMIN_API_KEY"):
            get_settings()
    finally:
        get_settings.cache_clear()


def test_readiness_reports_database_failure_without_details():
    from sqlalchemy.exc import OperationalError
    from yiedu.db import get_session

    class BrokenSession:
        def execute(self, statement):
            raise OperationalError("SELECT 1", {}, Exception("private database detail"))

    def broken_session():
        yield BrokenSession()

    app.dependency_overrides[get_session] = broken_session
    try:
        with TestClient(app) as client:
            response = client.get("/health/ready")
            assert response.status_code == 503
            assert response.json() == {"detail": "Database unavailable"}
    finally:
        app.dependency_overrides.clear()
