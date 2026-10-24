"""Template provisioning preferences, provenance and bilingual course metadata."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "workspaces",
        sa.Column("include_sample_content", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column("workspaces", "include_sample_content", server_default=None)
    for table, name in [
        ("tenants", "template_seed"),
        ("courses", "curriculum_meta"),
        ("courses", "translations"),
    ]:
        op.add_column(
            table,
            sa.Column(
                name, postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")
            ),
        )
        op.alter_column(table, name, server_default=None)


def downgrade():
    for table, name in [
        ("courses", "translations"),
        ("courses", "curriculum_meta"),
        ("tenants", "template_seed"),
    ]:
        op.drop_column(table, name)
    op.drop_column("workspaces", "include_sample_content")
