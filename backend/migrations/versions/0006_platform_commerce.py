# ruff: noqa: E501
"""Frozen PostgreSQL schema for platform governance, AI and commerce."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None

# Frozen SQL: do not import evolving application models in a historical migration.
SCHEMA = [
    "CREATE TABLE platform_config (\n\tkey VARCHAR(40) NOT NULL, \n\tdata JSONB NOT NULL, \n\trevision INTEGER NOT NULL, \n\tPRIMARY KEY (key)\n)",
    "CREATE TABLE platform_events (\n\tid UUID NOT NULL, \n\tactor_id UUID, \n\taction VARCHAR(100) NOT NULL, \n\tdetail JSONB NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, \n\tPRIMARY KEY (id), \n\tFOREIGN KEY(actor_id) REFERENCES users (id)\n)",
    "CREATE TABLE managed_templates (\n\tid VARCHAR(100) NOT NULL, \n\tmetadata_json JSONB NOT NULL, \n\tdocument JSONB NOT NULL, \n\tcourses JSONB NOT NULL, \n\tstatus VARCHAR(20) NOT NULL, \n\trevision INTEGER NOT NULL, \n\tupdated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, \n\tPRIMARY KEY (id)\n)",
    "CREATE TABLE private_connections (\n\tid UUID NOT NULL, \n\tscope VARCHAR(60) NOT NULL, \n\tprovider VARCHAR(20) NOT NULL, \n\tconfig JSONB NOT NULL, \n\tencrypted_secret TEXT NOT NULL, \n\tenabled BOOLEAN NOT NULL, \n\trevision INTEGER NOT NULL, \n\tPRIMARY KEY (id), \n\tCONSTRAINT uq_connection_scope UNIQUE (scope, provider)\n)",
    "CREATE INDEX ix_private_connections_scope ON private_connections (scope)",
    "CREATE TABLE ai_drafts (\n\tid UUID NOT NULL, \n\tscope VARCHAR(60) NOT NULL, \n\tactor_id UUID NOT NULL, \n\tkind VARCHAR(20) NOT NULL, \n\tprompt TEXT NOT NULL, \n\tresult JSONB NOT NULL, \n\tusage JSONB NOT NULL, \n\tstatus VARCHAR(20) NOT NULL, \n\tapplied_id VARCHAR(100) NOT NULL, \n\trequest_key VARCHAR(36) NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, \n\tPRIMARY KEY (id), \n\tCONSTRAINT uq_ai_request UNIQUE (actor_id, request_key), \n\tFOREIGN KEY(actor_id) REFERENCES users (id)\n)",
    "CREATE INDEX ix_ai_drafts_actor_id ON ai_drafts (actor_id)",
    "CREATE INDEX ix_ai_drafts_scope ON ai_drafts (scope)",
    "CREATE TABLE offers (\n\tid UUID NOT NULL, \n\ttenant_id UUID NOT NULL, \n\ttarget_type VARCHAR(10) NOT NULL, \n\ttarget_id UUID NOT NULL, \n\tprice_vnd INTEGER NOT NULL, \n\tprice_usd INTEGER NOT NULL, \n\tmode VARCHAR(10) NOT NULL, \n\tactive BOOLEAN NOT NULL, \n\trevision INTEGER NOT NULL, \n\tPRIMARY KEY (id), \n\tCONSTRAINT uq_offer UNIQUE (tenant_id, target_type, target_id), \n\tFOREIGN KEY(tenant_id) REFERENCES tenants (id)\n)",
    "CREATE INDEX ix_offers_tenant_id ON offers (tenant_id)",
    "CREATE TABLE payment_orders (\n\tid UUID NOT NULL, \n\ttenant_id UUID NOT NULL, \n\tbuyer_id UUID NOT NULL, \n\tpurpose VARCHAR(20) NOT NULL, \n\tprovider VARCHAR(20) NOT NULL, \n\tconnection_id UUID NOT NULL, \n\tamount INTEGER NOT NULL, \n\tcurrency VARCHAR(3) NOT NULL, \n\titems JSONB NOT NULL, \n\tgateway JSONB NOT NULL, \n\tprovider_id VARCHAR(120) NOT NULL, \n\ttransaction_id VARCHAR(200), \n\tcheckout_url TEXT NOT NULL, \n\tstatus VARCHAR(20) NOT NULL, \n\trequest_key VARCHAR(36) NOT NULL, \n\treview_note VARCHAR(1000) NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, \n\texpires_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tpaid_at TIMESTAMP WITH TIME ZONE, \n\tPRIMARY KEY (id), \n\tCONSTRAINT uq_checkout_request UNIQUE (buyer_id, request_key), \n\tCONSTRAINT uq_payment_transaction UNIQUE (connection_id, provider, transaction_id), \n\tFOREIGN KEY(tenant_id) REFERENCES tenants (id), \n\tFOREIGN KEY(buyer_id) REFERENCES users (id), \n\tFOREIGN KEY(connection_id) REFERENCES private_connections (id)\n)",
    "CREATE INDEX ix_payment_orders_buyer_id ON payment_orders (buyer_id)",
    "CREATE INDEX ix_payment_orders_tenant_id ON payment_orders (tenant_id)",
    "CREATE TABLE tenant_subscriptions (\n\ttenant_id UUID NOT NULL, \n\tplan VARCHAR(20) NOT NULL, \n\ttrial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tpaid_until TIMESTAMP WITH TIME ZONE, \n\tcancelled BOOLEAN NOT NULL, \n\tPRIMARY KEY (tenant_id), \n\tFOREIGN KEY(tenant_id) REFERENCES tenants (id)\n)",
]


def upgrade():
    op.add_column(
        "users",
        sa.Column("platform_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("users", "platform_admin", server_default=None)
    op.add_column("users", sa.Column("trial_started_at", sa.DateTime(timezone=True), nullable=True))
    for table in ["tenants", "workspaces"]:
        op.add_column(table, sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))
    for statement in SCHEMA:
        op.execute(statement)
    op.add_column(
        "tenants", sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true())
    )
    op.alter_column("tenants", "is_published", server_default=None)
    op.add_column(
        "tenant_subscriptions",
        sa.Column(
            "limits", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")
        ),
    )
    op.alter_column("tenant_subscriptions", "limits", server_default=None)
    op.add_column(
        "enrollments",
        sa.Column(
            "purchase_order_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("payment_orders.id"),
            nullable=True,
        ),
    )
    op.execute(
        "UPDATE users SET trial_started_at=now() WHERE id IN (SELECT user_id FROM memberships WHERE role='owner')"
    )
    op.execute(
        "INSERT INTO tenant_subscriptions (tenant_id,plan,trial_ends_at,cancelled,limits) SELECT id,'trial',now()+interval '30 days',false,'{}'::jsonb FROM tenants"
    )


def downgrade():
    op.drop_column("enrollments", "purchase_order_id")
    op.drop_column("tenants", "is_published")
    op.drop_table("tenant_subscriptions")
    op.drop_table("payment_orders")
    op.drop_table("offers")
    op.drop_table("ai_drafts")
    op.drop_table("private_connections")
    op.drop_table("managed_templates")
    op.drop_table("platform_events")
    op.drop_table("platform_config")
    for table in ["tenants", "workspaces"]:
        op.drop_column(table, "archived_at")
    op.drop_column("users", "trial_started_at")
    op.drop_column("users", "platform_admin")
