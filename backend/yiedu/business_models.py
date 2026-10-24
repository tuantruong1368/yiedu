"""Platform governance, private connections, reviewed AI drafts and commerce ledger."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from yiedu.models import Base


class PlatformConfig(Base):
    __tablename__ = "platform_config"
    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    data: Mapped[dict] = mapped_column(JSONB, default=dict)
    revision: Mapped[int] = mapped_column(default=1)


class PlatformEvent(Base):
    __tablename__ = "platform_events"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100))
    detail: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ManagedTemplate(Base):
    __tablename__ = "managed_templates"
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    metadata_json: Mapped[dict] = mapped_column(JSONB)
    document: Mapped[dict] = mapped_column(JSONB)
    courses: Mapped[list] = mapped_column(JSONB, default=list)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    revision: Mapped[int] = mapped_column(default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PrivateConnection(Base):
    __tablename__ = "private_connections"
    __table_args__ = (UniqueConstraint("scope", "provider", name="uq_connection_scope"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scope: Mapped[str] = mapped_column(String(60), index=True)
    provider: Mapped[str] = mapped_column(String(20))
    config: Mapped[dict] = mapped_column(JSONB, default=dict)
    encrypted_secret: Mapped[str] = mapped_column(Text, default="")
    enabled: Mapped[bool] = mapped_column(default=False)
    revision: Mapped[int] = mapped_column(default=1)


class AIDraft(Base):
    __tablename__ = "ai_drafts"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scope: Mapped[str] = mapped_column(String(60), index=True)
    actor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    kind: Mapped[str] = mapped_column(String(20))
    prompt: Mapped[str] = mapped_column(Text)
    result: Mapped[dict] = mapped_column(JSONB, default=dict)
    usage: Mapped[dict] = mapped_column(JSONB, default=dict)
    status: Mapped[str] = mapped_column(String(20), default="generating")
    applied_id: Mapped[str] = mapped_column(String(100), default="")
    request_key: Mapped[str] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("actor_id", "request_key", name="uq_ai_request"),)


class Offer(Base):
    __tablename__ = "offers"
    __table_args__ = (UniqueConstraint("tenant_id", "target_type", "target_id", name="uq_offer"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    target_type: Mapped[str] = mapped_column(String(10))
    target_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    price_vnd: Mapped[int] = mapped_column(Integer, default=0)
    price_usd: Mapped[int] = mapped_column(Integer, default=0)
    mode: Mapped[str] = mapped_column(String(10), default="free")
    active: Mapped[bool] = mapped_column(default=True)
    revision: Mapped[int] = mapped_column(default=1)


class PaymentOrder(Base):
    __tablename__ = "payment_orders"
    __table_args__ = (
        UniqueConstraint("buyer_id", "request_key", name="uq_checkout_request"),
        UniqueConstraint(
            "connection_id", "provider", "transaction_id", name="uq_payment_transaction"
        ),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    buyer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    purpose: Mapped[str] = mapped_column(String(20))
    provider: Mapped[str] = mapped_column(String(20))
    connection_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("private_connections.id"))
    amount: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3))
    items: Mapped[dict] = mapped_column(JSONB)
    gateway: Mapped[dict] = mapped_column(JSONB, default=dict)
    provider_id: Mapped[str] = mapped_column(String(120), default="")
    transaction_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    checkout_url: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    request_key: Mapped[str] = mapped_column(String(36))
    review_note: Mapped[str] = mapped_column(String(1000), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class TenantSubscription(Base):
    __tablename__ = "tenant_subscriptions"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), primary_key=True)
    plan: Mapped[str] = mapped_column(String(20), default="trial")
    limits: Mapped[dict] = mapped_column(JSONB, default=dict)
    trial_ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    paid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled: Mapped[bool] = mapped_column(default=False)
