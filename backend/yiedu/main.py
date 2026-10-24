import secrets
import uuid
from contextlib import asynccontextmanager
from typing import Annotated
from urllib.parse import urlparse

from fastapi import Depends, FastAPI, HTTPException, Query, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse

from yiedu.config import get_settings
from yiedu.db import get_session
from yiedu.models import Course, Tenant
from yiedu.product import router as product_router
from yiedu.schemas import CourseCreate, CourseRead, TenantCreate, TenantRead


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_settings()  # Fail startup when secrets/configuration are missing or unsafe.
    yield


app = FastAPI(title="YiEdu API", version="0.5.0", lifespan=lifespan)


app.include_router(product_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.middleware("http")
async def csrf_guard(request, call_next):
    if request.method not in {"GET", "HEAD", "OPTIONS"} and not request.headers.get(
        "authorization"
    ):
        origin = request.headers.get("origin")
        allowed = get_settings().allowed_origins.split(",")
        parsed = urlparse(origin or "")
        root = get_settings().root_domain
        tenant_origin = (
            parsed.hostname
            and parsed.hostname.endswith("." + root)
            and parsed.scheme == ("https" if get_settings().cookie_secure else "http")
            and parsed.port == urlparse(get_settings().public_base_url).port
        )
        if origin and origin not in allowed and not tenant_origin:
            return JSONResponse({"detail": "Origin không được phép"}, status_code=403)
        if request.cookies.get("yiedu_session") and not origin:
            return JSONResponse({"detail": "Thiếu Origin"}, status_code=403)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


api_key = APIKeyHeader(name="X-Admin-Key", auto_error=False)
DB = Annotated[Session, Depends(get_session)]


def require_admin(key: Annotated[str | None, Security(api_key)]):
    expected = get_settings().admin_api_key.get_secret_value()
    if key is None or not secrets.compare_digest(key.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")


admin = [Depends(require_admin)]


def tenant_or_404(db: Session, tenant_id: uuid.UUID):
    tenant = db.get(Tenant, tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


def save(db: Session, record):
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Resource conflicts with existing data"
        ) from None
    db.refresh(record)
    return record


@app.get("/health/live", tags=["health"])
def live():
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"])
def ready(db: DB):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="Database unavailable") from None
    return {"status": "ready"}


@app.post(
    "/api/v1/tenants",
    response_model=TenantRead,
    status_code=201,
    dependencies=admin,
    tags=["admin"],
)
def create_tenant(payload: TenantCreate, db: DB):
    return save(db, Tenant(**payload.model_dump()))


@app.get("/api/v1/tenants", response_model=list[TenantRead], dependencies=admin, tags=["admin"])
def list_tenants(db: DB, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    return db.scalars(select(Tenant).order_by(Tenant.id).limit(limit).offset(offset)).all()


@app.post(
    "/api/v1/tenants/{tenant_id}/courses",
    response_model=CourseRead,
    status_code=201,
    dependencies=admin,
    tags=["admin"],
)
def create_course(tenant_id: uuid.UUID, payload: CourseCreate, db: DB):
    tenant_or_404(db, tenant_id)
    return save(db, Course(tenant_id=tenant_id, **payload.model_dump()))


@app.get(
    "/api/v1/tenants/{tenant_id}/courses",
    response_model=list[CourseRead],
    dependencies=admin,
    tags=["admin"],
)
def list_courses(
    tenant_id: uuid.UUID, db: DB, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)
):
    tenant_or_404(db, tenant_id)
    stmt = (
        select(Course)
        .where(Course.tenant_id == tenant_id)
        .order_by(Course.id)
        .limit(limit)
        .offset(offset)
    )
    return db.scalars(stmt).all()
