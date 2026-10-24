"""30-day trial, explicit prepaid renewals and non-destructive expiration."""

import math
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import func, select

from yiedu.business_models import PlatformConfig, TenantSubscription
from yiedu.models import Course, Membership, Tenant, User

DEFAULT_PLANS = {
    "starter": {
        "name": "Khởi đầu / Starter",
        "monthly_vnd": 299000,
        "monthly_usd": 1200,
        "courses": 10,
        "learners": 100,
        "ai_daily": 10,
    },
    "growth": {
        "name": "Phát triển / Growth",
        "monthly_vnd": 799000,
        "monthly_usd": 3200,
        "courses": 50,
        "learners": 1000,
        "ai_daily": 30,
    },
    "scale": {
        "name": "Mở rộng / Scale",
        "monthly_vnd": 1990000,
        "monthly_usd": 8000,
        "courses": 200,
        "learners": 5000,
        "ai_daily": 100,
    },
}


def plans(db):
    row = db.get(PlatformConfig, "plans")
    return {
        "plans": row.data if row else DEFAULT_PLANS,
        "revision": row.revision if row else 1,
        "trial_days": 30,
        "annual_months_charged": 10,
        "auto_renew": False,
        "platform_transaction_fee_percent": 0,
    }


def start_trial(db, tenant_id, user):
    # Lock owner so concurrent first publications share the same trial anchor.
    owner = db.scalar(select(User).where(User.id == user.id).with_for_update())
    if owner.trial_started_at is None:
        owner.trial_started_at = datetime.now(UTC)
    row = TenantSubscription(
        tenant_id=tenant_id, trial_ends_at=owner.trial_started_at + timedelta(days=30), plan="trial"
    )
    db.add(row)
    return row


def subscription(db, tenant_id):
    row = db.get(TenantSubscription, tenant_id)
    now = datetime.now(UTC)
    if row is None:  # Legacy admin-created/standalone tenant: explicit grace rather than data loss.
        tenant = db.get(Tenant, tenant_id)
        row = TenantSubscription(
            tenant_id=tenant_id, plan="trial", trial_ends_at=tenant.created_at + timedelta(days=30)
        )
        db.add(row)
        db.flush()
    active_paid = row.paid_until is not None and row.paid_until > now
    end = row.paid_until if active_paid else row.trial_ends_at
    active = active_paid or row.trial_ends_at > now
    plan_id = row.plan if active_paid else "growth"
    limits = (
        row.limits
        if active_paid and row.limits
        else plans(db)["plans"].get(plan_id, DEFAULT_PLANS["growth"])
    )
    return {
        "plan": row.plan if active_paid else "trial",
        "status": "active" if active_paid else "trialing" if active else "expired",
        "trial_ends_at": row.trial_ends_at.isoformat(),
        "paid_until": row.paid_until.isoformat() if row.paid_until else None,
        "days_left": max(0, math.ceil((end - now).total_seconds() / 86400)),
        "auto_renew": False,
        "cancelled": row.cancelled,
        "limits": limits,
        "active": active,
    }


def writable(db, tenant_id, quota=None):
    from yiedu.config import get_settings

    if get_settings().instance_mode == "standalone":
        return
    tenant = db.scalar(select(Tenant).where(Tenant.id == tenant_id).with_for_update())
    if tenant and tenant.archived_at:
        raise HTTPException(409, "Hệ thống đang trong thùng rác / Restore this system first")
    info = subscription(db, tenant_id)
    if not info["active"]:
        raise HTTPException(
            402,
            (
                "Hết thời gian sử dụng. Gia hạn tại Gói dịch vụ; học viên vẫn học nội"
                " dung đã ghi danh / Renew your plan"
            ),
        )
    if quota == "courses":
        count = db.scalar(
            select(func.count()).select_from(Course).where(Course.tenant_id == tenant_id)
        )
    elif quota == "learners":
        count = db.scalar(
            select(func.count())
            .select_from(Membership)
            .where(Membership.tenant_id == tenant_id, Membership.role == "learner")
        )
    else:
        return
    if count >= info["limits"][quota]:
        raise HTTPException(402, "Đã đạt giới hạn gói dịch vụ / Plan limit reached")


def grant_term(db, order):
    row = db.scalar(
        select(TenantSubscription)
        .where(TenantSubscription.tenant_id == order.tenant_id)
        .with_for_update()
    )
    if not row:
        subscription(db, order.tenant_id)
        row = db.get(TenantSubscription, order.tenant_id)
    now = datetime.now(UTC)
    if row.paid_until and row.paid_until > now and row.plan != order.items["plan"]:
        raise HTTPException(
            409, "Gia hạn bằng gói hiện tại đến hết kỳ / Renew the current plan until term end"
        )
    start = max(now, row.paid_until) if row.paid_until else now
    order.items = {
        **order.items,
        "previous_subscription": {
            "plan": row.plan,
            "paid_until": row.paid_until.isoformat() if row.paid_until else None,
            "limits": row.limits,
        },
    }
    row.plan = order.items["plan"]
    row.limits = order.items["limits"]
    row.paid_until = start + timedelta(days=order.items["days"])
    row.cancelled = False
    order.items = {**order.items, "granted_until": row.paid_until.isoformat()}
