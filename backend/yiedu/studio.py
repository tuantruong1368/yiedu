"""Content projects use the same tenant membership boundary as lessons."""

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Response
from sqlalchemy import select

from yiedu.auth import DB, UserDep, require_member
from yiedu.models import StudioAsset, Tenant
from yiedu.product import audit, commit, encode
from yiedu.studio_schema import AssetWrite
from yiedu.studio_seed import upgrade_starter_content

router = APIRouter(prefix="/api/v1/runtime/{tenant_id}/studio", tags=["studio"])
ROLES = ["owner", "admin", "instructor"]


@router.post("/starter-content/upgrade")
def upgrade_content(tenant_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin"])
    tenant = db.scalar(select(Tenant).where(Tenant.id == tenant_id).with_for_update())
    if not tenant.template_seed:
        raise HTTPException(422, "Tenant has no installed starter curriculum")
    result = upgrade_starter_content(db, tenant)
    audit(db, tenant_id, user.id, "studio.starter-content.upgraded", result)
    commit(db)
    return result


def asset(db, tenant_id, asset_id, lock=False):
    stmt = select(StudioAsset).where(StudioAsset.tenant_id == tenant_id, StudioAsset.id == asset_id)
    row = db.scalar(stmt.with_for_update() if lock else stmt)
    if not row:
        raise HTTPException(404, "Không tìm thấy dự án / Project not found")
    return row


@router.get("")
def list_assets(tenant_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ROLES)
    return [
        encode(row)
        for row in db.scalars(
            select(StudioAsset)
            .where(StudioAsset.tenant_id == tenant_id)
            .order_by(StudioAsset.updated_at.desc())
            .limit(500)
        )
    ]


@router.post("", status_code=201)
def create_asset(tenant_id: uuid.UUID, payload: AssetWrite, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ROLES)
    row = StudioAsset(tenant_id=tenant_id, **payload.model_dump(exclude={"revision"}))
    db.add(row)
    audit(db, tenant_id, user.id, "studio.created", {"kind": payload.kind})
    commit(db)
    return encode(row)


@router.get("/{asset_id}")
def read_asset(tenant_id: uuid.UUID, asset_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ROLES)
    return encode(asset(db, tenant_id, asset_id))


@router.put("/{asset_id}")
def update_asset(
    tenant_id: uuid.UUID, asset_id: uuid.UUID, payload: AssetWrite, user: UserDep, db: DB
):
    require_member(db, user, tenant_id, ROLES)
    row = asset(db, tenant_id, asset_id, lock=True)
    if payload.revision != row.revision:
        raise HTTPException(409, "Dự án đã thay đổi. Tải lại trước khi lưu / Revision conflict")
    if payload.kind != row.kind:
        raise HTTPException(422, "Không thể thay đổi loại dự án / Cannot change project kind")
    for key, value in payload.model_dump(exclude={"revision"}).items():
        setattr(row, key, value)
    row.revision += 1
    row.updated_at = datetime.now(UTC)
    audit(db, tenant_id, user.id, "studio.updated", {"asset_id": str(asset_id)})
    commit(db)
    return encode(row)


@router.delete("/{asset_id}", status_code=204)
def delete_asset(tenant_id: uuid.UUID, asset_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ROLES)
    row = asset(db, tenant_id, asset_id, lock=True)
    db.delete(row)
    audit(db, tenant_id, user.id, "studio.deleted", {"asset_id": str(asset_id)})
    commit(db)
    return Response(status_code=204)
