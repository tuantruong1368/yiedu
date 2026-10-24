"Regression of authorization, commercial entitlements, trial policy and AI review."

import json
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from cryptography.fernet import Fernet
from sqlalchemy import select, update
from test_product_integration import clients as product_clients
from test_product_integration import create_site, register
from yiedu.business_models import PrivateConnection, TenantSubscription
from yiedu.config import get_settings
from yiedu.models import Enrollment, User
from yiedu.payment_gateways import momo_signature

clients = product_clients
pytestmark = pytest.mark.integration


@pytest.fixture(autouse=True)
def encryption(monkeypatch):
    monkeypatch.setenv("CONNECTIONS_ENCRYPTION_KEY", Fernet.generate_key().decode())
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def grant_admin(client, connection):
    user_id = client.get("/api/v1/auth/me").json()["id"]
    connection.execute(
        update(User).where(User.id == uuid.UUID(user_id)).values(platform_admin=True)
    )


def bank_config(client, tenant=None):
    scope = "platform" if not tenant else "tenant:" + tenant["id"]
    r = client.put(
        f"/api/v1/connections/{scope}/bank",
        json={
            "enabled": True,
            "config": {
                "bank_name": "Test Bank",
                "account_number": "123456789",
                "account_name": "Test Seller",
            },
        },
    )
    assert r.status_code == 200, r.text
    return r.json()


def course(client, tenant, slug="course"):
    r = client.post(
        f"/api/v1/runtime/{tenant['id']}/courses",
        json={"title": "Paid course", "slug": slug, "published": True},
    )
    assert r.status_code == 201, r.text
    c = r.json()
    r = client.post(
        f"/api/v1/runtime/{tenant['id']}/courses/{c['id']}/lessons",
        json={"title": "Restricted lesson", "content": "Do not leak this paid content"},
    )
    assert r.status_code == 201, r.text
    return c, r.json()


def paid_offer(owner, tenant, target, kind="course", **extra):
    data = {
        "target_type": kind,
        "target_id": target["id"],
        "mode": "paid",
        "price_vnd": 299000,
        "price_usd": 1500,
        **extra,
    }
    r = owner.put(f"/api/v1/runtime/{tenant['id']}/offers", json=data)
    assert r.status_code == 200, r.text
    return r.json()


def checkout(buyer, tenant, offer, provider="bank", **extra):
    r = buyer.post(
        f"/api/v1/runtime/{tenant['id']}/checkout",
        json={
            "provider": provider,
            "offer_id": offer["id"],
            "request_key": str(uuid.uuid4()),
            **extra,
        },
    )
    assert r.status_code == 201, r.text
    return r.json()


def confirm(owner, order, ref=None):
    return owner.post(
        f"/api/v1/payments/orders/{order['id']}/confirm-bank",
        json={
            "transaction_id": ref or "bank-" + uuid.uuid4().hex,
            "amount": order["amount"],
            "note": "Verified against bank statement",
        },
    )


def test_admin_not_granted_by_email_and_appearance_permissions(clients):
    owner, learner, outsider, conn = clients
    register(owner, "owner")
    assert owner.get("/api/v1/auth/me").json()["platform_admin"] is False
    assert owner.get("/api/v1/platform/overview").status_code == 403
    appearance = owner.get("/api/v1/platform/public").json()["appearance"]
    assert owner.put("/api/v1/platform/appearance", json=appearance).status_code == 403
    grant_admin(owner, conn)
    appearance["headline_vi"] = "Học viện của riêng bạn"
    saved = owner.put("/api/v1/platform/appearance", json=appearance)
    assert saved.status_code == 200, saved.text
    assert (
        owner.get("/api/v1/platform/public").json()["appearance"]["headline_vi"]
        == appearance["headline_vi"]
    )
    assert owner.put("/api/v1/platform/appearance", json=appearance).status_code == 409
    appearance.update(revision=saved.json()["revision"], color="red;display:none")
    assert owner.put("/api/v1/platform/appearance", json=appearance).status_code == 422


def test_connection_encryption_ownership_redaction_disconnect(clients):
    owner, learner, outsider, conn = clients
    register(owner, "owner")
    register(outsider, "outsider")
    _, tenant = create_site(owner)
    scope = "tenant:" + tenant["id"]
    path = f"/api/v1/connections/{scope}/openai"
    secret = "sk-test-not-a-real-api-key"
    r = owner.put(
        path,
        json={
            "enabled": True,
            "config": {"model": "gpt-4o-mini", "daily_limit": 2, "max_output_tokens": 4000},
            "secrets": {"api_key": secret},
        },
    )
    assert r.status_code == 200, r.text
    assert secret not in r.text
    cipher = conn.execute(
        select(PrivateConnection.encrypted_secret).where(PrivateConnection.scope == scope)
    ).scalar_one()
    assert secret not in cipher
    assert Fernet(get_settings().connections_encryption_key.get_secret_value()).decrypt(
        cipher.encode()
    )
    assert outsider.get(f"/api/v1/connections/{scope}").status_code == 403
    assert outsider.put(path, json={"enabled": False}).status_code == 403
    assert owner.put(path, json={"enabled": False, "revision": 0}).status_code == 409
    assert owner.delete(path).status_code == 200
    assert (
        conn.execute(
            select(PrivateConnection.encrypted_secret).where(PrivateConnection.scope == scope)
        ).scalar_one()
        == ""
    )


def test_paid_course_cannot_bypass_checkout_and_bank_reconciliation_is_idempotent(clients):
    owner, learner, outsider, conn = clients
    register(owner, "owner")
    register(learner, "learner")
    register(outsider, "outsider")
    _, tenant = create_site(owner)
    bank_config(owner, tenant)
    c, lesson = course(owner, tenant)
    offer = paid_offer(owner, tenant, c)
    base = f"/api/v1/runtime/{tenant['id']}"
    learner.post(f"/api/v1/sites/{tenant['slug']}/join")
    assert learner.post(base + f"/courses/{c['id']}/enroll").status_code == 402
    assert learner.get(base + f"/lessons/{lesson['id']}").status_code == 403
    order = checkout(learner, tenant, offer)
    assert "gateway" not in order and "secret" not in json.dumps(order)
    assert learner.post(f"/api/v1/payments/orders/{order['id']}/sync").json()["status"] == "pending"
    assert confirm(learner, order).status_code == 403
    assert outsider.get(f"/api/v1/payments/orders/{order['id']}").status_code == 403
    wrong = {**order, "amount": 1}
    assert confirm(owner, wrong).status_code == 409
    ref = "statement-unique-1001"
    assert confirm(owner, order, ref).status_code == 200
    assert confirm(owner, order, ref).status_code == 200
    assert learner.get(base + f"/lessons/{lesson['id']}").status_code == 200
    assert (
        len(
            list(
                conn.execute(
                    select(Enrollment.id).where(Enrollment.course_id == uuid.UUID(c["id"]))
                )
            )
        )
        == 1
    )
    second = checkout(learner, tenant, offer)
    assert confirm(owner, second, ref).status_code == 409
    assert owner.delete(base + f"/courses/{c['id']}").status_code == 409


def test_bundle_uses_paid_snapshot_and_preserves_prerequisites(clients):
    owner, learner, outsider, conn = clients
    register(owner, "owner")
    register(learner, "learner")
    _, tenant = create_site(owner)
    bank_config(owner, tenant)
    a, la = course(owner, tenant, "a")
    b, lb = course(owner, tenant, "b")
    base = f"/api/v1/runtime/{tenant['id']}"
    paid_offer(owner, tenant, a)
    paid_offer(owner, tenant, b)
    path = owner.post(
        base + "/paths", json={"title": "Complete pathway", "course_ids": [a["id"], b["id"]]}
    ).json()
    offer = paid_offer(owner, tenant, path, "path")
    learner.post(f"/api/v1/sites/{tenant['slug']}/join")
    assert learner.post(base + f"/paths/{path['id']}/enroll").status_code == 402
    order = checkout(learner, tenant, offer)
    assert (
        owner.put(
            base + f"/paths/{path['id']}",
            json={"title": "Changed pathway", "course_ids": [a["id"]]},
        ).status_code
        == 200
    )
    assert confirm(owner, order).status_code == 200
    overview = learner.get(base + "/overview").json()
    assert set(overview["enrolled"]) == {a["id"], b["id"]}
    # Restore the educational pathway; purchase should not skip prerequisites.
    owner.put(
        base + f"/paths/{path['id']}",
        json={"title": "Complete pathway", "course_ids": [a["id"], b["id"]]},
    )
    assert learner.get(base + f"/lessons/{lb['id']}").status_code == 403
    assert learner.post(base + f"/lessons/{la['id']}/complete").status_code == 200
    assert learner.get(base + f"/lessons/{lb['id']}").status_code == 200


def test_checkout_idempotency_freeze_price_and_reject_cross_tenant(clients):
    owner, learner, outsider, conn = clients
    register(owner, "owner")
    register(learner, "learner")
    _, tenant = create_site(owner)
    bank_config(owner, tenant)
    c, _ = course(owner, tenant)
    offer = paid_offer(owner, tenant, c)
    learner.post(f"/api/v1/sites/{tenant['slug']}/join")
    key = str(uuid.uuid4())
    order = checkout(learner, tenant, offer, request_key=key)
    paid_offer(owner, tenant, c, revision=offer["revision"], price_vnd=499000)
    retry = checkout(learner, tenant, offer, request_key=key)
    assert retry["id"] == order["id"] and retry["amount"] == 299000
    _, other = create_site(owner)
    learner.post(f"/api/v1/sites/{other['slug']}/join")
    bank_config(owner, other)
    assert (
        learner.post(
            f"/api/v1/runtime/{other['id']}/checkout",
            json={"provider": "bank", "offer_id": offer["id"], "request_key": key},
        ).status_code
        == 409
    )


def test_trial_expiry_keeps_existing_learning_and_recreation_does_not_reset(clients):
    owner, learner, outsider, conn = clients
    user = register(owner, "owner")
    register(learner, "learner")
    register(outsider, "outsider")
    _, tenant = create_site(owner)
    c, lesson = course(owner, tenant)
    base = f"/api/v1/runtime/{tenant['id']}"
    learner.post(f"/api/v1/sites/{tenant['slug']}/join")
    learner.post(base + f"/courses/{c['id']}/enroll")
    past = datetime.now(UTC) - timedelta(days=2)
    conn.execute(
        update(TenantSubscription)
        .where(TenantSubscription.tenant_id == uuid.UUID(tenant["id"]))
        .values(trial_ends_at=past)
    )
    assert (
        owner.post(base + "/courses", json={"title": "Blocked", "slug": "blocked"}).status_code
        == 402
    )
    assert outsider.post(f"/api/v1/sites/{tenant['slug']}/join").status_code == 402
    assert learner.get(base + f"/lessons/{lesson['id']}").status_code == 200
    assert learner.post(base + f"/lessons/{lesson['id']}/complete").status_code == 200
    conn.execute(
        update(User)
        .where(User.id == uuid.UUID(user["user"]["id"]))
        .values(trial_started_at=past - timedelta(days=30))
    )
    second_workspace, second = create_site(owner)
    assert owner.get(f"/api/v1/sites/{second['slug']}").status_code == 404
    assert owner.post(f"/api/v1/workspaces/{second_workspace['id']}/publish").status_code == 402
    assert (
        owner.get(f"/api/v1/runtime/{second['id']}/billing").json()["subscription"]["status"]
        == "expired"
    )


def test_subscription_receives_platform_account_and_duplicate_payment_cannot_extend_twice(clients):
    owner, learner, outsider, conn = clients
    register(owner, "owner")
    register(outsider, "platform")
    grant_admin(outsider, conn)
    bank_config(outsider)
    _, tenant = create_site(owner)
    base = f"/api/v1/runtime/{tenant['id']}/billing"
    r = owner.post(
        base + "/checkout",
        json={
            "provider": "bank",
            "plan": "starter",
            "interval": "year",
            "request_key": str(uuid.uuid4()),
        },
    )
    assert r.status_code == 201, r.text
    order = r.json()
    assert order["amount"] == 2990000 and order["receiver"]["account_name"] == "Test Seller"
    assert confirm(owner, order).status_code == 403
    assert confirm(outsider, order, "platform-statement-123").status_code == 200
    before = owner.get(base).json()["subscription"]["paid_until"]
    assert confirm(outsider, order, "platform-statement-123").status_code == 200
    assert owner.get(base).json()["subscription"]["paid_until"] == before
    assert owner.get(base).json()["subscription"]["plan"] == "starter"


def test_archiving_draft_and_system_has_recovery_and_owner_check(clients):
    owner, learner, outsider, conn = clients
    register(owner, "owner")
    register(outsider, "outsider")
    w, tenant = create_site(owner)
    route = f"/api/v1/workspaces/{w['id']}/archive"
    assert outsider.put(route, json={"archived": True}).status_code == 404
    assert owner.put(route, json={"archived": True}).status_code == 200
    assert owner.post(f"/api/v1/workspaces/{w['id']}/publish").status_code == 409
    assert owner.get(f"/api/v1/sites/{tenant['slug']}").status_code == 200
    assert owner.put(route, json={"archived": False}).status_code == 200
    route = f"/api/v1/me/sites/{tenant['id']}/archive"
    assert outsider.put(route, json={"archived": True}).status_code == 403
    assert owner.put(route, json={"archived": True}).status_code == 200
    assert owner.get(f"/api/v1/sites/{tenant['slug']}").status_code == 404
    assert owner.put(route, json={"archived": False}).status_code == 200
    assert owner.get(f"/api/v1/sites/{tenant['slug']}").status_code == 200


def test_managed_template_edit_publish_seed_archive_preserves_created_tenant(clients):
    owner, learner, outsider, conn = clients
    register(owner, "owner")
    grant_admin(owner, conn)
    base = owner.get("/api/v1/platform/templates/academy").json()
    base.pop("id")
    key = "custom-" + uuid.uuid4().hex[:10]
    base.update(name="Custom learning", status="draft", revision=1)
    r = owner.put(f"/api/v1/platform/templates/{key}", json=base)
    assert r.status_code == 200, r.text
    assert owner.get(f"/api/v1/catalog/templates/{key}").status_code == 404
    saved = r.json()
    saved.pop("id")
    saved["status"] = "published"
    assert owner.put(f"/api/v1/platform/templates/{key}", json=saved).status_code == 200
    preview = owner.get(f"/api/v1/catalog/templates/{key}").json()
    assert preview["template"]["course_count"] > 0
    w = owner.post(
        "/api/v1/workspaces", json={"name": "Custom academy", "slug": key, "template_id": key}
    ).json()
    published = owner.post(f"/api/v1/workspaces/{w['id']}/publish")
    assert published.status_code == 200, published.text
    tenant = published.json()["tenant"]
    overview = owner.get(f"/api/v1/runtime/{tenant['id']}/overview").json()
    assert len(overview["courses"]) == len(base["courses"])
    latest = owner.get(f"/api/v1/platform/templates/{key}").json()
    assert (
        owner.delete(f"/api/v1/platform/templates/{key}?revision={latest['revision']}").status_code
        == 200
    )
    assert owner.get(f"/api/v1/catalog/templates/{key}").status_code == 404
    assert owner.get(f"/api/v1/sites/{tenant['slug']}").status_code == 200


def ai_course():
    return {
        "title": "Sorting course",
        "description": "Understand sorting through concrete examples and practice.",
        "lessons": [
            {
                "title": "Sorting " + str(i),
                "explanation": (
                    "Compare adjacent numbers and swap them until the sequence is ordered."
                ),
                "example": "For [3, 1, 2], compare 3 and 1, swap, then compare 3 and 2.",
                "exercise": "Sort [4, 2, 1, 3] and list each comparison and swap.",
                "answer": "The final order is [1, 2, 3, 4]. Explain intermediate steps.",
                "simulation": "sorting",
            }
            for i in range(2)
        ],
    }


def test_ai_connection_required_draft_review_apply_idempotency_and_delete_keeps_quota(
    clients, monkeypatch
):
    owner, learner, outsider, conn = clients
    register(owner, "owner")
    register(outsider, "outsider")
    _, tenant = create_site(owner)
    scope = "tenant:" + tenant["id"]
    route = f"/api/v1/ai/{scope}"
    payload = {
        "kind": "course",
        "prompt": "Build a practical sorting course with examples.",
        "request_key": str(uuid.uuid4()),
    }
    assert owner.post(route + "/generate", json=payload).status_code == 409
    assert (
        owner.put(
            f"/api/v1/connections/{scope}/openai",
            json={
                "enabled": True,
                "config": {"model": "gpt-4o-mini", "daily_limit": 1},
                "secrets": {"api_key": "sk-not-real"},
            },
        ).status_code
        == 200
    )
    calls = []

    def fake(config, secret, payload):
        calls.append(1)
        return ai_course(), {"tokens": {"total_tokens": 120}}

    monkeypatch.setattr("yiedu.intelligence.openai_generate", fake)
    r = owner.post(route + "/generate", json=payload)
    assert r.status_code == 201, r.text
    draft = r.json()
    assert draft["status"] == "ready"
    assert owner.get(f"/api/v1/runtime/{tenant['id']}/overview").json()["courses"] == []
    assert (
        owner.post(route + "/generate", json=payload).json()["id"] == draft["id"]
        and len(calls) == 1
    )
    assert outsider.get(route + "/drafts").status_code == 403
    applied = owner.post(route + f"/drafts/{draft['id']}/apply", json={"title": "Reviewed sorting"})
    assert applied.status_code == 200, applied.text
    assert owner.post(
        route + f"/drafts/{draft['id']}/apply", json={"title": "Reviewed sorting"}
    ).json()["already_applied"]
    overview = owner.get(f"/api/v1/runtime/{tenant['id']}/overview").json()
    assert len(overview["courses"]) == 1 and not overview["courses"][0]["published"]
    lesson = owner.get(
        f"/api/v1/runtime/{tenant['id']}/lessons/{overview['lessons'][0]['id']}"
    ).json()
    assert any(n["type"] == "studioAsset" for n in lesson["document"]["content"])
    assert owner.delete(route + f"/drafts/{draft['id']}").status_code == 200
    assert owner.get(route + "/drafts").json() == []
    payload["request_key"] = str(uuid.uuid4())
    assert owner.post(route + "/generate", json=payload).status_code == 429


def test_ai_template_with_curriculum_is_draft_until_reviewed(clients, monkeypatch):
    owner, learner, outsider, conn = clients
    register(owner, "owner")
    grant_admin(owner, conn)
    owner.put(
        "/api/v1/connections/platform/openai",
        json={
            "enabled": True,
            "config": {"model": "gpt-4o-mini"},
            "secrets": {"api_key": "sk-not-real"},
        },
    )
    content = {
        "name": "AI Test Academy",
        "description": "A reviewed curriculum with practical exercises.",
        "color": "#205b4b",
        "pages": [
            {
                "title": "Page " + str(i),
                "headline": "Learn by building",
                "body": "Build concrete skills with explanations, practice and reflection.",
                "highlights": ["Original examples", "Applied practice"],
            }
            for i in range(3)
        ],
        "courses": [ai_course()],
    }
    monkeypatch.setattr("yiedu.intelligence.openai_generate", lambda *args: (content, {}))
    r = owner.post(
        "/api/v1/ai/platform/generate",
        json={
            "kind": "template",
            "prompt": "Create an academy with a sorting course.",
            "request_key": str(uuid.uuid4()),
        },
    )
    assert r.status_code == 201, r.text
    key = "ai-" + uuid.uuid4().hex[:12]
    r = owner.post(
        f"/api/v1/ai/platform/drafts/{r.json()['id']}/apply",
        json={"title": "Reviewed academy", "template_id": key},
    )
    assert r.status_code == 200, r.text
    assert owner.get(f"/api/v1/catalog/templates/{key}").status_code == 404
    template = owner.get(f"/api/v1/platform/templates/{key}").json()
    assert len(template["courses"][0]["lessons"]) == 2 and len(template["document"]["pages"]) == 3


def test_forged_momo_webhook_cannot_grant_enrollment(clients, monkeypatch):
    owner, learner, outsider, conn = clients
    register(owner, "owner")
    register(learner, "learner")
    _, tenant = create_site(owner)
    c, lesson = course(owner, tenant)
    offer = paid_offer(owner, tenant, c)
    scope = "tenant:" + tenant["id"]
    owner.put(
        f"/api/v1/connections/{scope}/momo",
        json={
            "enabled": True,
            "config": {"mode": "sandbox", "partner_code": "TEST", "access_key": "access"},
            "secrets": {"secret_key": "test-secret"},
        },
    )
    learner.post(f"/api/v1/sites/{tenant['slug']}/join")
    monkeypatch.setattr(
        "yiedu.commerce.create_momo",
        lambda row: (str(row.id), "https://test-payment.momo.vn/v2/gateway/pay"),
    )
    order = checkout(learner, tenant, offer, "momo")
    data = {
        "amount": order["amount"],
        "extraData": "",
        "message": "Success",
        "orderId": order["id"],
        "orderInfo": "YiEdu " + order["id"],
        "orderType": "momo_wallet",
        "partnerCode": "TEST",
        "payType": "qr",
        "requestId": order["id"],
        "responseTime": 1000000,
        "resultCode": 0,
        "transId": 1234567,
    }
    values = {"accessKey": "access", **data}
    data["signature"] = "forged"
    # Use an unauthenticated request as a provider would.
    outsider.headers.clear()
    outsider.cookies.clear()
    url = f"/api/v1/payments/webhooks/momo/{order['id']}"
    assert outsider.post(url, json=data).status_code == 400
    assert learner.get(f"/api/v1/runtime/{tenant['id']}/lessons/{lesson['id']}").status_code == 403
    data["signature"] = momo_signature(values, "test-secret")
    assert outsider.post(url, json=data).status_code == 204
    assert outsider.post(url, json=data).status_code == 204
    assert learner.get(f"/api/v1/runtime/{tenant['id']}/lessons/{lesson['id']}").status_code == 200


def test_openai_adapter_contract_and_refusal_handling(monkeypatch):
    from yiedu.business_schemas import GenerateRequest
    from yiedu.intelligence import openai_generate

    class Reply:
        status_code = 200

        def json(self):
            return {
                "status": "completed",
                "output": [{"content": [{"type": "output_text", "text": json.dumps(ai_course())}]}],
                "usage": {"total_tokens": 100},
            }

    def post(url, **kwargs):
        assert url == "https://api.openai.com/v1/responses"
        assert kwargs["json"]["store"] is False
        assert kwargs["json"]["text"]["format"]["strict"] is True
        return Reply()

    monkeypatch.setattr("yiedu.intelligence.httpx.post", post)
    payload = GenerateRequest(
        kind="course", prompt="Create original sorting lessons.", request_key=uuid.uuid4()
    )
    result, usage = openai_generate({"model": "gpt-4o-mini"}, {"api_key": "sk-test"}, payload)
    assert len(result["lessons"]) == 2 and usage["tokens"]["total_tokens"] == 100


def test_recorded_refund_revokes_only_access_granted_by_that_order(clients):
    owner, learner, outsider, conn = clients
    register(owner, "owner")
    register(learner, "learner")
    _, tenant = create_site(owner)
    bank_config(owner, tenant)
    c, lesson = course(owner, tenant)
    offer = paid_offer(owner, tenant, c)
    learner.post(f"/api/v1/sites/{tenant['slug']}/join")
    order = checkout(learner, tenant, offer)
    assert confirm(owner, order).status_code == 200
    route = f"/api/v1/payments/orders/{order['id']}/record-refund"
    payload = {
        "transaction_id": "refund-receipt-1001",
        "amount": order["amount"],
        "note": "Full refund executed and receipt verified",
    }
    assert learner.post(route, json=payload).status_code == 403
    assert owner.post(route, json=payload).status_code == 200
    assert learner.get(f"/api/v1/runtime/{tenant['id']}/lessons/{lesson['id']}").status_code == 403
    assert owner.post(route, json=payload).status_code == 200
    assert owner.post(f"/api/v1/payments/orders/{order['id']}/sync").json()["status"] == "refunded"


def test_paypal_adapter_requires_verified_currency_receiver_and_order(monkeypatch):
    from types import SimpleNamespace

    from fastapi import HTTPException
    from yiedu.connections import seal
    from yiedu.payment_gateways import verify_paypal_capture

    order = SimpleNamespace(
        id=uuid.uuid4(),
        provider_id="PAYPAL123",
        amount=1500,
        currency="USD",
        gateway={
            "config": {"mode": "sandbox", "client_id": "client", "merchant_id": "SELLER"},
            "secret": seal({"client_secret": "secret"}),
        },
    )
    payment = {
        "id": "PAYPAL123",
        "status": "COMPLETED",
        "purchase_units": [
            {
                "custom_id": str(order.id),
                "payee": {"merchant_id": "SELLER"},
                "payments": {
                    "captures": [
                        {
                            "id": "CAPTURE123",
                            "status": "COMPLETED",
                            "amount": {"currency_code": "USD", "value": "15.00"},
                        }
                    ]
                },
            }
        ],
    }

    def request(method, url, **kwargs):
        if url.endswith("/v1/oauth2/token"):
            return {"access_token": "token"}
        assert (
            method == "GET"
            and url == "https://api-m.sandbox.paypal.com/v2/checkout/orders/PAYPAL123"
        )
        return payment

    monkeypatch.setattr("yiedu.payment_gateways.request", request)
    assert verify_paypal_capture(order, capture=True) == "CAPTURE123"
    payment["purchase_units"][0]["payee"]["merchant_id"] = "OTHER"
    with pytest.raises(HTTPException):
        verify_paypal_capture(order)
    payment["purchase_units"][0]["payee"]["merchant_id"] = "SELLER"
    payment["purchase_units"][0]["payments"]["captures"][0]["amount"]["value"] = "0.01"
    with pytest.raises(HTTPException):
        verify_paypal_capture(order)
