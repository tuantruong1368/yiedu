"""Tenant content library, reusable project snapshots and optimistic revisions."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "lessons", sa.Column("revision", sa.Integer(), nullable=False, server_default="1")
    )
    op.alter_column("lessons", "revision", server_default=None)
    op.create_table(
        "studio_assets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False
        ),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("kind", sa.String(30), nullable=False),
        sa.Column("locale", sa.String(2), nullable=False),
        sa.Column("data", postgresql.JSONB(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("ix_studio_assets_tenant_id", "studio_assets", ["tenant_id"])


def downgrade():
    op.drop_index("ix_studio_assets_tenant_id", "studio_assets")
    op.drop_table("studio_assets")
    op.drop_column("lessons", "revision")
