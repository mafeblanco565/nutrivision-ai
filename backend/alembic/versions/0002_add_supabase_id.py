"""Add supabase_id to users, make hashed_password nullable

Revision ID: 0002_add_supabase_id
Revises: 0001_initial
Create Date: 2026-05-21 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_add_supabase_id"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("supabase_id", sa.String(255), nullable=True))
    op.create_index("ix_users_supabase_id", "users", ["supabase_id"], unique=True)
    op.alter_column("users", "hashed_password", nullable=True)


def downgrade() -> None:
    op.alter_column("users", "hashed_password", nullable=False)
    op.drop_index("ix_users_supabase_id", table_name="users")
    op.drop_column("users", "supabase_id")
