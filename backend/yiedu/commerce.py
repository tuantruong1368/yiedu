"Course/bundle checkout, seller-owned gateways and separate YiEdu subscription invoices."

import csv
import io
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException, Query, Request, Response
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from yiedu.auth import DB, UserDep, require_member
from yiedu.billing import grant_term, plans, subscription, writable
from yiedu.business_models import Offer, PaymentOrder, PlatformEvent, TenantSubscription
from yiedu.business_schemas import BankReview, CheckoutWrite, OfferWrite
from yiedu.connections import connection, platform_admin
from yiedu.models import Course, Enrollment, LearningPath, Tenant, User
from yiedu.payment_gateways import (
    create_momo,
    create_paypal,
    paypal_auth,
    query_momo,
    request,
    verify_momo_ipn,
    verify_paypal_capture,
)
from yiedu.product import commit, encode
from yiedu.product_schemas import StrictModel

router = APIRouter(prefix="/api/v1", tags=["commerce"])


def order_view(row):
    result = {
        k: v for k, v in encode(row).items() if k not in {"gateway", "request_key", "connection_id"}
    }
    if row.status == "pending" and row.expires_at < datetime.now(UTC):
        result["status"] = "expired"
    result["receiver"] = {
        k: v
        for k, v in row.gateway.get("config", {}).items()
        if k
        in {
            "account_name",
            "account_number",
            "bank_name",
            "instructions",
            "merchant_id",
            "partner_code",
            "mode",
        }
    }
    result["transfer_reference"] = "YI" + row.id.hex.upper()
    result["sandbox"] = (
        row.provider != "bank" and row.gateway.get("config", {}).get("mode", "sandbox") == "sandbox"
    )
    return result


def target_courses(db, tenant_id, target_type, target_id):
    model = Course if target_type == "course" else LearningPath
    target = db.get(model, target_id)
    if not target or target.tenant_id != tenant_id:
        raise HTTPException(404, "Course/path not found")
    ids = [str(target.id)] if target_type == "course" else target.course_ids
    courses = list(
        db.scalars(
            select(Course).where(
                Course.tenant_id == tenant_id, Course.id.in_([uuid.UUID(x) for x in ids])
            )
        )
    )
    if not ids or len(courses) != len(ids) or any(not c.published for c in courses):
        raise HTTPException(
            409, ("Xuất bản đầy đủ khóa học trước khi mở bán / Publish all courses before selling")
        )
    return target.title, ids


def course_offer(db, tenant_id, course_id):
    return db.scalar(
        select(Offer).where(
            Offer.tenant_id == tenant_id,
            Offer.target_type == "course",
            Offer.target_id == course_id,
        )
    )


def enforce_free_enroll(db, tenant_id, course_id, user):
    existing = db.scalar(
        select(Enrollment.id).where(
            Enrollment.tenant_id == tenant_id,
            Enrollment.user_id == user.id,
            Enrollment.course_id == course_id,
        )
    )
    if existing:
        return
    writable(db, tenant_id)
    offer = course_offer(db, tenant_id, course_id)
    if offer and (not offer.active or offer.mode == "paid"):
        raise HTTPException(
            402, "Mua khóa học hoặc combo để mở nội dung / Purchase this course or a bundle"
        )


@router.get("/runtime/{tenant_id}/store")
def storefront(tenant_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id)
    scope = "tenant:" + str(tenant_id)
    methods = [
        provider
        for provider in ["paypal", "momo", "bank"]
        if (c := connection(db, scope, provider)) and c.enabled
    ]
    return {
        "offers": [
            encode(o) for o in db.scalars(select(Offer).where(Offer.tenant_id == tenant_id))
        ],
        "methods": methods,
    }


@router.post("/runtime/{tenant_id}/paths/{path_id}/enroll")
def enroll_path(tenant_id: uuid.UUID, path_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id)
    writable(db, tenant_id)
    _, ids = target_courses(db, tenant_id, "path", path_id)
    offer = db.scalar(
        select(Offer).where(
            Offer.tenant_id == tenant_id, Offer.target_type == "path", Offer.target_id == path_id
        )
    )
    if offer and (not offer.active or offer.mode != "free"):
        raise HTTPException(402, "Purchase this bundle first")
    for course_id in ids:
        if not offer:
            enforce_free_enroll(db, tenant_id, uuid.UUID(course_id), user)
        db.execute(
            insert(Enrollment)
            .values(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                user_id=user.id,
                course_id=uuid.UUID(course_id),
            )
            .on_conflict_do_nothing(index_elements=["tenant_id", "user_id", "course_id"])
        )
    commit(db)
    return {"ok": True}


@router.get("/runtime/{tenant_id}/commerce")
def seller_commerce(tenant_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin"])
    return {
        "offers": [
            encode(o) for o in db.scalars(select(Offer).where(Offer.tenant_id == tenant_id))
        ],
        "orders": [
            order_view(o)
            for o in db.scalars(
                select(PaymentOrder)
                .where(PaymentOrder.tenant_id == tenant_id, PaymentOrder.purpose == "course")
                .order_by(PaymentOrder.created_at.desc())
                .limit(100)
            )
        ],
    }


@router.put("/runtime/{tenant_id}/offers")
def save_offer(tenant_id: uuid.UUID, payload: OfferWrite, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin"])
    writable(db, tenant_id)
    # Serialize offers with checkout to prevent buying a price changed mid-request.
    db.execute(select(Tenant.id).where(Tenant.id == tenant_id).with_for_update())
    target_courses(db, tenant_id, payload.target_type, payload.target_id)
    row = db.scalar(
        select(Offer).where(
            Offer.tenant_id == tenant_id,
            Offer.target_type == payload.target_type,
            Offer.target_id == payload.target_id,
        )
    )
    if payload.revision != (row.revision if row else 0):
        raise HTTPException(409, "Price revision conflict")
    if not row:
        row = Offer(tenant_id=tenant_id, revision=0)
        db.add(row)
    for key, value in payload.model_dump(exclude={"revision"}).items():
        setattr(row, key, value)
    row.revision += 1
    db.add(
        PlatformEvent(
            actor_id=user.id,
            action="offer.updated",
            detail={
                "tenant_id": str(tenant_id),
                "target_id": str(payload.target_id),
                "mode": payload.mode,
            },
        )
    )
    commit(db)
    return encode(row)


def create_checkout(db, tenant_id, payload, user, purpose):
    require_member(db, user, tenant_id, ["owner"] if purpose == "subscription" else None)
    db.execute(select(Tenant.id).where(Tenant.id == tenant_id).with_for_update())
    db.execute(select(User.id).where(User.id == user.id).with_for_update())
    existing = db.scalar(
        select(PaymentOrder).where(
            PaymentOrder.buyer_id == user.id, PaymentOrder.request_key == str(payload.request_key)
        )
    )
    if existing:
        if (
            existing.tenant_id != tenant_id
            or existing.purpose != purpose
            or existing.provider != payload.provider
            or str(existing.items.get("offer_id", "")) != str(payload.offer_id or "")
            or existing.items.get("plan") != payload.plan
            or existing.items.get("interval", "month") != payload.interval
        ):
            raise HTTPException(409, "Checkout key reused for a different order")
        db.commit()  # Release tenant/account locks before acquiring the gateway order lock.
        return existing
    scope = "platform" if purpose == "subscription" else "tenant:" + str(tenant_id)
    conn = connection(db, scope, payload.provider)
    if not conn or not conn.enabled:
        raise HTTPException(409, "Bên bán chưa bật phương thức này / Payment method unavailable")
    if purpose == "course":
        writable(db, tenant_id)
        if payload.plan or not payload.offer_id:
            raise HTTPException(422, "Choose a course or bundle offer")
        offer = db.get(Offer, payload.offer_id)
        if not offer or offer.tenant_id != tenant_id or not offer.active or offer.mode != "paid":
            raise HTTPException(409, "Offer not available")
        title, ids = target_courses(db, tenant_id, offer.target_type, offer.target_id)
        amount = offer.price_usd if payload.provider == "paypal" else offer.price_vnd
        items = {
            "title": title,
            "course_ids": ids,
            "offer_id": str(offer.id),
            "offer_revision": offer.revision,
        }
    else:
        if not payload.plan or payload.offer_id:
            raise HTTPException(422, "Choose a subscription plan")
        info = subscription(db, tenant_id)
        if info["status"] == "active" and info["plan"] != payload.plan:
            raise HTTPException(
                409,
                (
                    "Chọn gia hạn gói hiện tại. Có thể đổi gói khi hết kỳ / Change plan "
                    "after the current term"
                ),
            )
        pending = db.scalar(
            select(PaymentOrder).where(
                PaymentOrder.tenant_id == tenant_id,
                PaymentOrder.purpose == "subscription",
                PaymentOrder.status == "pending",
                PaymentOrder.expires_at > datetime.now(UTC),
            )
        )
        if pending:
            raise HTTPException(
                409, "Kiểm tra hoặc hủy hóa đơn đang chờ trước / An invoice is already pending"
            )
        p = plans(db)["plans"][payload.plan]
        amount = p["monthly_usd"] if payload.provider == "paypal" else p["monthly_vnd"]
        if payload.interval == "year":
            amount *= 10
        items = {
            "title": "YiEdu · " + p["name"],
            "plan": payload.plan,
            "interval": payload.interval,
            "days": 365 if payload.interval == "year" else 30,
            "limits": p,
        }
    if amount <= 0:
        raise HTTPException(
            409, "Chưa niêm yết giá cho phương thức này / No price for this currency"
        )
    if payload.provider == "momo" and amount > 50000000:
        raise HTTPException(422, "MoMo: tối đa 50 triệu VND cho giao dịch này / Use bank transfer")
    row = PaymentOrder(
        tenant_id=tenant_id,
        buyer_id=user.id,
        purpose=purpose,
        provider=payload.provider,
        connection_id=conn.id,
        amount=amount,
        currency="USD" if payload.provider == "paypal" else "VND",
        items=items,
        gateway={"config": conn.config, "secret": conn.encrypted_secret},
        request_key=str(payload.request_key),
        expires_at=datetime.now(UTC) + timedelta(hours=24),
    )
    db.add(row)
    commit(db)
    return row


def start_gateway(db, row):
    row = db.scalar(
        select(PaymentOrder)
        .where(PaymentOrder.id == row.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if row.status != "pending" or row.checkout_url or row.provider == "bank":
        return row
    if row.expires_at < datetime.now(UTC):
        raise HTTPException(409, "Đơn đã hết hạn / Order expired")
    if row.provider == "paypal":
        row.provider_id, row.checkout_url = create_paypal(row)
    else:
        row.provider_id, row.checkout_url = create_momo(row)
    commit(db)
    return row


def checkout_with_recovery(db, row):
    try:
        row = start_gateway(db, row)
        row.review_note = ""
    except HTTPException as exc:
        if exc.status_code != 502:
            raise
        row.review_note = str(exc.detail)
    commit(db)
    return row


@router.post("/runtime/{tenant_id}/checkout", status_code=201)
def checkout_course(tenant_id: uuid.UUID, payload: CheckoutWrite, user: UserDep, db: DB):
    return order_view(
        checkout_with_recovery(db, create_checkout(db, tenant_id, payload, user, "course"))
    )


@router.post("/runtime/{tenant_id}/billing/checkout", status_code=201)
def checkout_plan(tenant_id: uuid.UUID, payload: CheckoutWrite, user: UserDep, db: DB):
    return order_view(
        checkout_with_recovery(db, create_checkout(db, tenant_id, payload, user, "subscription"))
    )


@router.get("/runtime/{tenant_id}/billing")
def read_billing(tenant_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin"])
    return {
        "site_published": db.get(Tenant, tenant_id).is_published,
        "subscription": subscription(db, tenant_id),
        **plans(db),
        "methods": [
            p
            for p in ["paypal", "momo", "bank"]
            if (c := connection(db, "platform", p)) and c.enabled
        ],
        "invoices": [
            order_view(o)
            for o in db.scalars(
                select(PaymentOrder)
                .where(PaymentOrder.tenant_id == tenant_id, PaymentOrder.purpose == "subscription")
                .order_by(PaymentOrder.created_at.desc())
                .limit(50)
            )
        ],
    }


@router.post("/runtime/{tenant_id}/billing/cancel-renewal")
def cancel_renewal(tenant_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner"])
    subscription(db, tenant_id)
    row = db.get(TenantSubscription, tenant_id)
    row.cancelled = True
    commit(db)
    return subscription(db, tenant_id)


def order_access(row, user, db, seller=False):
    if row is None:
        raise HTTPException(404, "Order not found")
    if not seller and row.buyer_id == user.id:
        return
    if row.purpose == "subscription":
        platform_admin(user)
    else:
        require_member(db, user, row.tenant_id, ["owner", "admin"])


@router.get("/payments/orders/{order_id}")
def read_order(order_id: uuid.UUID, user: UserDep, db: DB):
    row = db.get(PaymentOrder, order_id)
    order_access(row, user, db)
    return order_view(row)


@router.get("/payments/my-orders")
def my_orders(user: UserDep, db: DB):
    return [
        order_view(o)
        for o in db.scalars(
            select(PaymentOrder)
            .where(PaymentOrder.buyer_id == user.id)
            .order_by(PaymentOrder.created_at.desc())
            .limit(100)
        )
    ]


@router.get("/platform/orders")
def platform_orders(user: UserDep, db: DB, offset: int = Query(0, ge=0)):
    platform_admin(user)
    return [
        order_view(o)
        for o in db.scalars(
            select(PaymentOrder)
            .where(PaymentOrder.purpose == "subscription")
            .order_by(PaymentOrder.created_at.desc())
            .offset(offset)
            .limit(100)
        )
    ]


def settle(db, row, transaction_id):
    # A gateway round-trip may have committed/released a lock. Re-read under lock so a
    # concurrent webhook cannot extend a subscription or grant access twice.
    row = db.scalar(
        select(PaymentOrder)
        .where(PaymentOrder.id == row.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    db.execute(select(Tenant.id).where(Tenant.id == row.tenant_id).with_for_update())
    if row.status == "paid":
        return
    if row.status == "refunded":
        return
    if not transaction_id:
        raise HTTPException(409, "Missing payment transaction")
    duplicate = db.scalar(
        select(PaymentOrder.id).where(
            PaymentOrder.provider == row.provider,
            PaymentOrder.connection_id == row.connection_id,
            PaymentOrder.transaction_id == transaction_id,
            PaymentOrder.id != row.id,
        )
    )
    if duplicate:
        raise HTTPException(409, "Transaction already assigned to another order")
    if row.purpose == "subscription":
        grant_term(db, row)
    else:
        # The paid snapshot governs access even if the seller edits the bundle later.
        for course_id in row.items["course_ids"]:
            c = db.get(Course, uuid.UUID(course_id))
            if not c or c.tenant_id != row.tenant_id:
                raise HTTPException(409, "Purchased course missing; seller must reconcile")
            db.execute(
                insert(Enrollment)
                .values(
                    id=uuid.uuid4(),
                    tenant_id=row.tenant_id,
                    user_id=row.buyer_id,
                    course_id=c.id,
                    purchase_order_id=row.id,
                )
                .on_conflict_do_nothing(index_elements=["tenant_id", "user_id", "course_id"])
            )
    row.transaction_id, row.status, row.paid_at = transaction_id, "paid", datetime.now(UTC)
    db.add(
        PlatformEvent(
            action="payment.settled",
            detail={
                "order_id": str(row.id),
                "purpose": row.purpose,
                "provider": row.provider,
                "amount": row.amount,
                "currency": row.currency,
            },
        )
    )
    commit(db)


@router.post("/payments/orders/{order_id}/sync")
def sync_payment(order_id: uuid.UUID, user: UserDep, db: DB):
    row = db.scalar(select(PaymentOrder).where(PaymentOrder.id == order_id).with_for_update())
    order_access(row, user, db)
    if row.status in {"paid", "refunded"} or row.provider == "bank":
        return order_view(row)
    if row.provider == "momo":
        transaction_id = query_momo(row)
        if not transaction_id and not row.checkout_url:
            row = start_gateway(db, row)
    else:
        if not row.provider_id:
            row = start_gateway(db, row)
        transaction_id = verify_paypal_capture(row, capture=True)
    if transaction_id:
        settle(db, row, transaction_id)
    return order_view(row)


@router.post("/payments/orders/{order_id}/cancel")
def cancel_order(order_id: uuid.UUID, user: UserDep, db: DB):
    row = db.scalar(select(PaymentOrder).where(PaymentOrder.id == order_id).with_for_update())
    order_access(row, user, db)
    if row.status != "pending":
        raise HTTPException(409, "Only pending orders can be cancelled")
    row.status = "cancelled"
    commit(db)
    return order_view(row)


@router.post("/payments/orders/{order_id}/confirm-bank")
def approve_bank(order_id: uuid.UUID, payload: BankReview, user: UserDep, db: DB):
    row = db.scalar(select(PaymentOrder).where(PaymentOrder.id == order_id).with_for_update())
    order_access(row, user, db, seller=True)
    if row.provider != "bank" or payload.amount != row.amount:
        raise HTTPException(409, "Wrong method or amount")
    if row.status == "paid":
        if row.transaction_id != payload.transaction_id:
            raise HTTPException(409, "Order was reconciled using another reference")
        return order_view(row)
    if row.status not in {"pending", "cancelled"}:
        raise HTTPException(409, "Order cannot be reconciled")
    row.review_note = payload.note
    db.add(
        PlatformEvent(
            actor_id=user.id,
            action="bank.approved",
            detail={
                "order_id": str(row.id),
                "reference": payload.transaction_id,
                "note": payload.note,
            },
        )
    )
    settle(db, row, payload.transaction_id)
    return order_view(row)


@router.post("/payments/webhooks/momo/{order_id}")
def momo_ipn(order_id: uuid.UUID, data: dict, db: DB):
    import json

    if len(json.dumps(data)) > 64000:
        raise HTTPException(413, "Notification too large")
    row = db.scalar(select(PaymentOrder).where(PaymentOrder.id == order_id).with_for_update())
    if not row or row.provider != "momo":
        raise HTTPException(404, "MoMo order not found")
    transaction_id = verify_momo_ipn(row, data)
    if transaction_id:
        settle(db, row, transaction_id)
    return Response(status_code=204)


@router.post("/payments/webhooks/paypal/{connection_id}")
def paypal_webhook(connection_id: uuid.UUID, data: dict, req: Request, db: DB):
    import json

    if len(json.dumps(data)) > 128000:
        raise HTTPException(413, "Notification too large")
    provider_id = (
        data.get("resource", {})
        .get("supplementary_data", {})
        .get("related_ids", {})
        .get("order_id")
    )
    row = db.scalar(
        select(PaymentOrder)
        .where(
            PaymentOrder.connection_id == connection_id,
            PaymentOrder.provider == "paypal",
            PaymentOrder.provider_id == provider_id,
        )
        .with_for_update()
    )
    if not row:
        return {"received": True}
    base, headers = paypal_auth(row)
    webhook_id = row.gateway["config"].get("webhook_id")
    if not webhook_id:
        raise HTTPException(409, "Configure PayPal webhook id")
    verification = {
        k: req.headers.get("paypal-" + k.replace("_", "-"), "")
        for k in [
            "auth_algo",
            "cert_url",
            "transmission_id",
            "transmission_sig",
            "transmission_time",
        ]
    }
    verification.update(webhook_id=webhook_id, webhook_event=data)
    if (
        request(
            "POST",
            base + "/v1/notifications/verify-webhook-signature",
            headers=headers,
            json=verification,
        ).get("verification_status")
        != "SUCCESS"
    ):
        raise HTTPException(400, "Invalid PayPal signature")
    transaction_id = verify_paypal_capture(row)
    if transaction_id:
        settle(db, row, transaction_id)
    return {"received": True}


@router.get("/runtime/{tenant_id}/orders.csv")
def export_orders(tenant_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin"])
    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(
        [
            "id",
            "status",
            "provider",
            "currency",
            "amount_minor_units",
            "transaction_id",
            "created_at",
        ]
    )
    for o in db.scalars(
        select(PaymentOrder)
        .where(PaymentOrder.tenant_id == tenant_id, PaymentOrder.purpose == "course")
        .order_by(PaymentOrder.created_at.desc())
        .limit(10000)
    ):
        writer.writerow(
            [
                str(o.id),
                o.status,
                o.provider,
                o.currency,
                o.amount,
                ("'" + o.transaction_id) if o.transaction_id else "",
                o.created_at.isoformat(),
            ]
        )
    return Response(
        "\ufeff" + stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="yiedu-orders.csv"'},
    )


class RefundRecord(StrictModel):
    transaction_id: str = Field(min_length=5, max_length=150, pattern=r"^[a-zA-Z0-9._:/-]+$")
    amount: int = Field(gt=0)
    note: str = Field(min_length=10, max_length=1000)


@router.post("/payments/orders/{order_id}/record-refund")
def record_refund(order_id: uuid.UUID, payload: RefundRecord, user: UserDep, db: DB):
    """Record a full refund already executed outside YiEdu; never sends a payout."""
    row = db.scalar(select(PaymentOrder).where(PaymentOrder.id == order_id).with_for_update())
    order_access(row, user, db, seller=True)
    db.execute(select(Tenant.id).where(Tenant.id == row.tenant_id).with_for_update())
    if row.status == "refunded":
        return order_view(row)
    if row.status != "paid" or payload.amount != row.amount:
        raise HTTPException(409, "Only a full refund of a paid order can be recorded")
    if row.purpose == "subscription":
        term = db.scalar(
            select(TenantSubscription)
            .where(TenantSubscription.tenant_id == row.tenant_id)
            .with_for_update()
        )
        previous = row.items.get("previous_subscription")
        if (
            not previous
            or not term.paid_until
            or term.paid_until.isoformat() != row.items.get("granted_until")
        ):
            raise HTTPException(
                409, "Reconcile later subscription renewals before refunding this invoice"
            )
        term.plan = previous["plan"]
        term.paid_until = (
            datetime.fromisoformat(previous["paid_until"]) if previous["paid_until"] else None
        )
        term.limits = previous["limits"]
    else:
        alternatives = list(
            db.scalars(
                select(PaymentOrder).where(
                    PaymentOrder.tenant_id == row.tenant_id,
                    PaymentOrder.buyer_id == row.buyer_id,
                    PaymentOrder.purpose == "course",
                    PaymentOrder.status == "paid",
                    PaymentOrder.id != row.id,
                )
            )
        )
        owned = list(
            db.scalars(
                select(Enrollment).where(
                    Enrollment.tenant_id == row.tenant_id,
                    Enrollment.user_id == row.buyer_id,
                    Enrollment.purchase_order_id == row.id,
                )
            )
        )
        for enrollment in owned:
            alternative = next(
                (
                    o
                    for o in alternatives
                    if str(enrollment.course_id) in o.items.get("course_ids", [])
                ),
                None,
            )
            if alternative:
                enrollment.purchase_order_id = alternative.id
            else:
                db.delete(enrollment)
    row.status = "refunded"
    row.items = {
        **row.items,
        "refund": {
            **payload.model_dump(),
            "recorded_by": str(user.id),
            "recorded_at": datetime.now(UTC).isoformat(),
            "execution": "external",
        },
    }
    db.add(
        PlatformEvent(
            actor_id=user.id,
            action="refund.recorded",
            detail={"order_id": str(row.id), **payload.model_dump()},
        )
    )
    commit(db)
    return order_view(row)
