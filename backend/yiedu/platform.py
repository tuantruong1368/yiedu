"""Session-authenticated platform console. Role grants are deliberately out of band."""

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException, Query
from pydantic import Field
from sqlalchemy import func, select

from yiedu.auth import DB, UserDep, require_member
from yiedu.billing import plans, subscription
from yiedu.business_models import (
    ManagedTemplate,
    PaymentOrder,
    PlatformConfig,
    PlatformEvent,
    PrivateConnection,
    TenantSubscription,
)
from yiedu.business_schemas import (
    Appearance,
    ArchiveWrite,
    ConnectionWrite,
    PlansWrite,
    TemplateWrite,
)
from yiedu.config import get_settings
from yiedu.connections import describe, platform_admin, save_connection, scope_access
from yiedu.managed_catalog import as_editable, bundled, metadata, public_catalog
from yiedu.models import Tenant, User, Workspace
from yiedu.product import commit, encode, get_workspace
from yiedu.product_schemas import StrictModel

router = APIRouter(prefix="/api/v1", tags=["platform"])


def appearance(db):
    row = db.get(PlatformConfig, "appearance")
    return {
        **Appearance().model_dump(),
        **(row.data if row else {}),
        "revision": row.revision if row else 1,
    }


def event(db, user, action, detail=None):
    db.add(PlatformEvent(actor_id=user.id, action=action, detail=detail or {}))


@router.get("/platform/public")
def public_config(db: DB):
    return {"appearance": appearance(db), "billing": plans(db)}


@router.get("/platform/overview")
def platform_overview(user: UserDep, db: DB):
    platform_admin(user)
    return {
        "appearance": appearance(db),
        "billing": plans(db),
        "counts": {
            "tenants": db.scalar(select(func.count()).select_from(Tenant)),
            "users": db.scalar(select(func.count()).select_from(User)),
            "templates": len(public_catalog(db)),
            "orders": db.scalar(select(func.count()).select_from(PaymentOrder)),
        },
        "events": [
            encode(e)
            for e in db.scalars(
                select(PlatformEvent).order_by(PlatformEvent.created_at.desc()).limit(50)
            )
        ],
        "encryption_ready": bool(get_settings().connections_encryption_key.get_secret_value()),
    }


@router.put("/platform/appearance")
def edit_appearance(payload: Appearance, user: UserDep, db: DB):
    platform_admin(user)
    from yiedu.managed_catalog import entry

    entry(db, payload.hero_template)
    db.execute(select(User.id).where(User.id == user.id).with_for_update())
    row = db.get(PlatformConfig, "appearance")
    if payload.revision != (row.revision if row else 1):
        raise HTTPException(409, "Appearance revision conflict")
    if not row:
        row = PlatformConfig(key="appearance", revision=1)
        db.add(row)
    row.data = payload.model_dump(exclude={"revision"})
    row.revision += 1
    event(db, user, "appearance.updated", {"revision": row.revision})
    commit(db)
    return appearance(db)


@router.put("/platform/plans")
def edit_plans(payload: PlansWrite, user: UserDep, db: DB):
    platform_admin(user)
    db.execute(select(User.id).where(User.id == user.id).with_for_update())
    row = db.get(PlatformConfig, "plans")
    if payload.revision != (row.revision if row else 1):
        raise HTTPException(409, "Pricing revision conflict")
    if not row:
        row = PlatformConfig(key="plans", revision=1)
        db.add(row)
    row.data = payload.model_dump(exclude={"revision"})
    row.revision += 1
    event(db, user, "plans.updated", {"revision": row.revision})
    commit(db)
    return plans(db)


@router.get("/platform/tenants")
def platform_tenants(
    user: UserDep, db: DB, q: str = Query("", max_length=100), offset: int = Query(0, ge=0)
):
    platform_admin(user)
    stmt = select(Tenant).order_by(Tenant.created_at.desc()).offset(offset).limit(50)
    if q:
        stmt = stmt.where(Tenant.name.ilike("%" + q + "%") | Tenant.slug.ilike("%" + q + "%"))
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "slug": t.slug,
            "archived_at": t.archived_at,
            "subscription": subscription(db, t.id),
        }
        for t in db.scalars(stmt)
    ]


class ExtendTrial(StrictModel):
    days: int = Field(ge=1, le=90)
    reason: str = Field(min_length=5, max_length=500)


@router.post("/platform/tenants/{tenant_id}/extend-trial")
def extend_trial(tenant_id: uuid.UUID, payload: ExtendTrial, user: UserDep, db: DB):
    platform_admin(user)
    if not db.get(Tenant, tenant_id):
        raise HTTPException(404, "Tenant not found")
    subscription(db, tenant_id)
    row = db.scalar(
        select(TenantSubscription)
        .where(TenantSubscription.tenant_id == tenant_id)
        .with_for_update()
    )
    row.trial_ends_at = max(datetime.now(UTC), row.trial_ends_at) + timedelta(days=payload.days)
    event(db, user, "trial.extended", {"tenant_id": str(tenant_id), **payload.model_dump()})
    commit(db)
    return subscription(db, tenant_id)


@router.get("/platform/templates")
def admin_templates(user: UserDep, db: DB):
    platform_admin(user)
    from yiedu.catalog import TEMPLATES

    overrides = {r.id: r for r in db.scalars(select(ManagedTemplate))}
    return [
        {
            **(metadata(overrides[t["id"]]) if t["id"] in overrides else t),
            "status": overrides[t["id"]].status if t["id"] in overrides else "published",
            "revision": overrides[t["id"]].revision if t["id"] in overrides else 0,
        }
        for t in TEMPLATES
    ] + [
        {**metadata(r), "status": r.status, "revision": r.revision}
        for r in overrides.values()
        if not bundled(r.id)
    ]


@router.post("/platform/templates/validate")
def validate_template_import(payload: TemplateWrite, user: UserDep):
    platform_admin(user)
    return payload.model_dump()


@router.get("/platform/templates/{template_id}")
def read_managed_template(template_id: str, user: UserDep, db: DB):
    platform_admin(user)
    return as_editable(db, template_id)


@router.put("/platform/templates/{template_id}")
def save_template(template_id: str, payload: TemplateWrite, user: UserDep, db: DB):
    platform_admin(user)
    import re

    if not re.fullmatch(r"[a-z][a-z0-9-]{0,99}", template_id):
        raise HTTPException(422, "Invalid template id")
    from yiedu.template_library import library

    groups = {g["id"]: g for g in library()["groups"]}
    if payload.category_id not in groups:
        raise HTTPException(422, "Unknown category")
    db.execute(select(User.id).where(User.id == user.id).with_for_update())
    row = db.get(ManagedTemplate, template_id)
    if row and payload.revision != row.revision or not row and payload.revision not in {0, 1}:
        raise HTTPException(409, "Template revision conflict")
    if not row:
        row = ManagedTemplate(id=template_id, revision=0)
        db.add(row)
    group = groups[payload.category_id]
    row.metadata_json = {
        "name": payload.name,
        "description": payload.description,
        "description_en": payload.description_en or payload.description,
        "color": payload.color,
        "group_ids": [payload.category_id],
        "category": group["label"]["vi"],
        "category_en": group["label"]["en"],
        "subtitle": payload.name,
        "subtitle_en": payload.name,
        "tagline": {"vi": "Học theo cách của bạn", "en": "Your way to learn"},
    }
    row.document, row.courses, row.status = payload.document, payload.courses, payload.status
    row.revision += 1
    row.updated_at = datetime.now(UTC)
    event(
        db,
        user,
        "template.updated",
        {"id": template_id, "revision": row.revision, "status": row.status},
    )
    commit(db)
    return as_editable(db, template_id)


@router.delete("/platform/templates/{template_id}")
def archive_template(template_id: str, user: UserDep, db: DB, revision: int = Query(ge=0)):
    platform_admin(user)
    data = as_editable(db, template_id)
    if data["revision"] != revision:
        raise HTTPException(409, "Template revision conflict")
    data.pop("id")
    data["status"] = "archived"
    # A bundled template has revision 0 until its first database override.
    data["revision"] = max(1, revision)
    return save_template(template_id, TemplateWrite.model_validate(data), user, db)


@router.post("/platform/templates/{template_id}/design")
def design_template(template_id: str, user: UserDep, db: DB):
    platform_admin(user)
    data = as_editable(db, template_id)
    row = Workspace(
        owner_id=user.id,
        template_id=template_id,
        name=data["name"],
        slug="design-" + uuid.uuid4().hex[:12],
        data=data["document"],
        include_sample_content=False,
    )
    db.add(row)
    commit(db)
    return {"workspace_id": str(row.id), "template_revision": data["revision"]}


class TemplateDesign(StrictModel):
    workspace_id: uuid.UUID
    revision: int = Field(ge=0)


@router.put("/platform/templates/{template_id}/design")
def apply_template_design(template_id: str, payload: TemplateDesign, user: UserDep, db: DB):
    platform_admin(user)
    w = get_workspace(db, user, payload.workspace_id)
    data = as_editable(db, template_id)
    if data["revision"] != payload.revision:
        raise HTTPException(409, "Template revision conflict")
    data.pop("id")
    data.update(document=w.data, revision=max(1, payload.revision))
    return save_template(template_id, TemplateWrite.model_validate(data), user, db)


@router.get("/connections/{scope}")
def get_connections(scope: str, user: UserDep, db: DB):
    scope_access(scope, user, db)
    return [
        describe(c)
        for c in db.scalars(select(PrivateConnection).where(PrivateConnection.scope == scope))
    ]


@router.put("/connections/{scope}/{provider}")
def put_connection(scope: str, provider: str, payload: ConnectionWrite, user: UserDep, db: DB):
    return save_connection(db, scope, provider, payload, user)


@router.delete("/connections/{scope}/{provider}")
def disconnect(scope: str, provider: str, user: UserDep, db: DB):
    scope_access(scope, user, db)
    from yiedu.connections import connection

    row = connection(db, scope, provider)
    if row:
        # Pending orders retain an encrypted snapshot for subsequent reconciliation.
        row.enabled, row.encrypted_secret = False, ""
        row.revision += 1
        event(db, user, "connection.disconnected", {"scope": scope, "provider": provider})
        commit(db)
    return {"ok": True}


@router.put("/workspaces/{workspace_id}/archive")
def archive_workspace(workspace_id: uuid.UUID, payload: ArchiveWrite, user: UserDep, db: DB):
    row = get_workspace(db, user, workspace_id, lock=True)
    row.archived_at = datetime.now(UTC) if payload.archived else None
    event(
        db,
        user,
        "workspace.archived" if payload.archived else "workspace.restored",
        {"id": str(workspace_id)},
    )
    commit(db)
    return encode(row)


@router.put("/me/sites/{tenant_id}/archive")
def archive_site(tenant_id: uuid.UUID, payload: ArchiveWrite, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner"])
    row = db.get(Tenant, tenant_id)
    row.archived_at = datetime.now(UTC) if payload.archived else None
    event(
        db,
        user,
        "tenant.archived" if payload.archived else "tenant.restored",
        {"id": str(tenant_id)},
    )
    commit(db)
    return {"ok": True}


@router.post("/me/sites/{tenant_id}/design")
def design_site(tenant_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin"])
    row = db.scalar(
        select(Workspace).where(
            Workspace.tenant_id == tenant_id,
            Workspace.owner_id == user.id,
            Workspace.archived_at.is_(None),
        )
    )
    if not row:
        tenant = db.get(Tenant, tenant_id)
        row = Workspace(
            owner_id=user.id,
            template_id=tenant.template_id,
            name=tenant.name,
            slug=tenant.slug,
            tenant_id=tenant.id,
            data=tenant.published_page,
            include_sample_content=False,
        )
        db.add(row)
        commit(db)
    return encode(row)
