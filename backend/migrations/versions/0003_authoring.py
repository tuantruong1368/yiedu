"""Rich lesson documents and bilingual lesson content."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("lessons", sa.Column("document", postgresql.JSONB(), nullable=True))
    op.add_column(
        "lessons",
        sa.Column(
            "translations",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )
    op.alter_column("lessons", "translations", server_default=None)


def downgrade():
    op.drop_column("lessons", "translations")
    op.drop_column("lessons", "document")
