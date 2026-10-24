"First-party PayPal Orders and MoMo wallet adapters; no caller-controlled API hosts."

import hashlib
import hmac
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException

from yiedu.config import get_settings
from yiedu.connections import unseal


def request(method, url, **kwargs):
    try:
        response = httpx.request(method, url, timeout=httpx.Timeout(25, connect=8), **kwargs)
        if response.status_code >= 400:
            raise HTTPException(
                502,
                f"Cổng thanh toán trả lỗi {response.status_code}; "
                "chưa ghi nhận đã trả tiền / Payment provider error",
            )
        return response.json()
    except httpx.HTTPError, ValueError:
        raise HTTPException(
            502,
            (
                "Chưa nhận phản hồi cổng thanh toán. Kiểm tra lại đơn trước khi tạo "
                "đơn mới / Payment provider unavailable"
            ),
        ) from None


def paypal_auth(order):
    config = order.gateway["config"]
    secret = unseal(order.gateway["secret"])
    base = (
        "https://api-m.paypal.com"
        if config.get("mode") == "live"
        else "https://api-m.sandbox.paypal.com"
    )
    data = request(
        "POST",
        base + "/v1/oauth2/token",
        auth=(config["client_id"], secret["client_secret"]),
        data={"grant_type": "client_credentials"},
    )
    token = data.get("access_token")
    if not isinstance(token, str):
        raise HTTPException(502, "PayPal authentication failed")
    return base, {"Authorization": "Bearer " + token, "Content-Type": "application/json"}


def amount_text(order):
    return str(order.amount) if order.currency == "VND" else f"{Decimal(order.amount) / 100:.2f}"


def checked_checkout(url, provider):
    p = urlparse(url)
    hosts = {
        "paypal": {"www.paypal.com", "www.sandbox.paypal.com"},
        "momo": {"payment.momo.vn", "test-payment.momo.vn"},
    }
    if p.scheme != "https" or p.hostname not in hosts[provider]:
        raise HTTPException(502, "Payment provider returned an invalid checkout URL")
    return url


def create_paypal(order):
    base, headers = paypal_auth(order)
    headers.update({"PayPal-Request-Id": str(order.id), "Prefer": "return=representation"})
    callback = get_settings().public_base_url.rstrip("/") + "/checkout/" + str(order.id)
    data = request(
        "POST",
        base + "/v2/checkout/orders",
        headers=headers,
        json={
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": str(order.id),
                    "custom_id": str(order.id),
                    "description": order.items["title"][:127],
                    "amount": {"currency_code": order.currency, "value": amount_text(order)},
                    "payee": {"merchant_id": order.gateway["config"]["merchant_id"]},
                }
            ],
            "payment_source": {
                "paypal": {
                    "experience_context": {
                        "return_url": callback + "?returned=1",
                        "cancel_url": callback + "?cancelled=1",
                        "user_action": "PAY_NOW",
                    }
                }
            },
        },
    )
    url = next(
        (
            link["href"]
            for link in data.get("links", [])
            if link.get("rel") in {"approve", "payer-action"}
        ),
        "",
    )
    if not data.get("id"):
        raise HTTPException(502, "PayPal order missing")
    return data["id"], checked_checkout(url, "paypal")


def verify_paypal_capture(order, capture=False):
    base, headers = paypal_auth(order)
    # Query first so retries following an interrupted successful capture stay idempotent.
    endpoint = base + "/v2/checkout/orders/" + order.provider_id
    data = request("GET", endpoint, headers=headers)
    if capture and data.get("status") == "APPROVED":
        headers.update(
            {"PayPal-Request-Id": "capture-" + str(order.id), "Prefer": "return=representation"}
        )
        data = request("POST", endpoint + "/capture", headers=headers, json={})
    if data.get("status") != "COMPLETED":
        return None
    units = data.get("purchase_units", [])
    if len(units) != 1:
        raise HTTPException(409, "Unexpected PayPal purchase units")
    unit = units[0]
    captures = unit.get("payments", {}).get("captures", [])
    if len(captures) != 1:
        raise HTTPException(409, "Unexpected PayPal captures")
    payment = captures[0]
    try:
        exact = Decimal(payment["amount"]["value"]) == Decimal(amount_text(order))
    except KeyError, InvalidOperation:
        exact = False
    if (
        not exact
        or payment.get("amount", {}).get("currency_code") != order.currency
        or unit.get("custom_id") != str(order.id)
        or unit.get("payee", {}).get("merchant_id") != order.gateway["config"]["merchant_id"]
    ):
        raise HTTPException(409, "PayPal amount, currency or receiver does not match order")
    return payment["id"] if payment.get("status") == "COMPLETED" else None


def momo_signature(values, secret):
    raw = "&".join(f"{k}={v}" for k, v in values.items())
    return hmac.new(secret.encode(), raw.encode(), hashlib.sha256).hexdigest()


def momo_details(order):
    config, secret = order.gateway["config"], unseal(order.gateway["secret"])
    host = (
        "https://payment.momo.vn"
        if config.get("mode") == "live"
        else "https://test-payment.momo.vn"
    )
    return config, secret["secret_key"], host


def create_momo(order):
    config, secret, host = momo_details(order)
    root = get_settings().public_base_url.rstrip("/")
    values = {
        "accessKey": config["access_key"],
        "amount": order.amount,
        "extraData": "",
        "ipnUrl": root + "/api/v1/payments/webhooks/momo/" + str(order.id),
        "orderId": str(order.id),
        "orderInfo": "YiEdu " + str(order.id),
        "partnerCode": config["partner_code"],
        "redirectUrl": root + "/checkout/" + str(order.id) + "?returned=1",
        "requestId": str(order.id),
        "requestType": "captureWallet",
    }
    payload = {k: v for k, v in values.items() if k != "accessKey"}
    payload.update(signature=momo_signature(values, secret), lang="vi", autoCapture=True)
    data = request("POST", host + "/v2/gateway/api/create", json=payload)
    if data.get("resultCode") != 0:
        raise HTTPException(
            502,
            ("MoMo chưa tạo được giao dịch. Kiểm tra merchant và cấu hình / MoMo create failed"),
        )
    return str(order.id), checked_checkout(data.get("payUrl", ""), "momo")


def verify_momo_ipn(order, data):
    config, secret, _ = momo_details(order)
    keys = [
        "amount",
        "extraData",
        "message",
        "orderId",
        "orderInfo",
        "orderType",
        "partnerCode",
        "payType",
        "requestId",
        "responseTime",
        "resultCode",
        "transId",
    ]
    if any(k not in data for k in keys):
        raise HTTPException(400, "Incomplete MoMo notification")
    values = {"accessKey": config["access_key"], **{k: data[k] for k in keys}}
    if not hmac.compare_digest(
        momo_signature(values, secret).encode("ascii"),
        str(data.get("signature", "")).encode("utf-8"),
    ):
        raise HTTPException(400, "Invalid MoMo signature")
    if (
        str(data["orderId"]) != str(order.id)
        or str(data["amount"]) != str(order.amount)
        or data["partnerCode"] != config["partner_code"]
        or str(data["requestId"]) != str(order.id)
    ):
        raise HTTPException(409, "MoMo payment does not match order")
    return str(data["transId"]) if data["resultCode"] == 0 and data["transId"] else None


def query_momo(order):
    config, secret, host = momo_details(order)
    values = {
        "accessKey": config["access_key"],
        "orderId": str(order.id),
        "partnerCode": config["partner_code"],
        "requestId": "query-" + str(order.id),
    }
    data = request(
        "POST",
        host + "/v2/gateway/api/query",
        json={
            "partnerCode": config["partner_code"],
            "requestId": values["requestId"],
            "orderId": str(order.id),
            "signature": momo_signature(values, secret),
            "lang": "vi",
        },
    )
    if str(data.get("orderId")) != str(order.id) or str(data.get("amount")) != str(order.amount):
        return None
    return str(data["transId"]) if data.get("resultCode") == 0 and data.get("transId") else None
