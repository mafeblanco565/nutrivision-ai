"""Initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_premium", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # profiles
    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(100), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("sex", sa.Enum("male", "female", "other", name="sexenum"), nullable=False),
        sa.Column("height_cm", sa.Float(), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=False),
        sa.Column("activity_level", sa.Enum(
            "sedentary", "lightly_active", "moderately_active", "very_active", "extra_active",
            name="activitylevelenum"
        ), nullable=False),
        sa.Column("goal_type", sa.Enum("lose_fat", "maintain", "gain_muscle", name="goaltypeenum"), nullable=False),
        sa.Column("bmr", sa.Float(), nullable=True),
        sa.Column("tdee", sa.Float(), nullable=True),
        sa.Column("target_calories", sa.Float(), nullable=True),
        sa.Column("target_protein_g", sa.Float(), nullable=True),
        sa.Column("target_carbs_g", sa.Float(), nullable=True),
        sa.Column("target_fat_g", sa.Float(), nullable=True),
        sa.Column("locale", sa.String(10), nullable=False, server_default="es"),
        sa.Column("timezone", sa.String(50), nullable=False, server_default="UTC"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_profiles_id", "profiles", ["id"])

    # foods
    op.create_table(
        "foods",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("name_es", sa.String(200), nullable=True),
        sa.Column("logmeal_id", sa.String(100), nullable=True),
        sa.Column("calories_per_100g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("protein_per_100g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("carbs_per_100g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("fat_per_100g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("fiber_per_100g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("sugar_per_100g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("sodium_per_100g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("logmeal_id"),
    )
    op.create_index("ix_foods_id", "foods", ["id"])
    op.create_index("ix_foods_name", "foods", ["name"])

    # meal_entries
    op.create_table(
        "meal_entries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("meal_type", sa.Enum(
            "breakfast", "lunch", "dinner", "snack", name="mealtypeenum"
        ), nullable=False),
        sa.Column("eaten_at", sa.Date(), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("image_path", sa.String(500), nullable=True),
        sa.Column("ai_raw_response", sa.Text(), nullable=True),
        sa.Column("ai_confidence", sa.Float(), nullable=True),
        sa.Column("total_calories", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_protein_g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_carbs_g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_fat_g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_fiber_g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("notes", sa.String(500), nullable=True),
        sa.Column("is_manual", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_meal_entries_id", "meal_entries", ["id"])
    op.create_index("ix_meal_entries_user_id", "meal_entries", ["user_id"])
    op.create_index("ix_meal_entries_eaten_at", "meal_entries", ["eaten_at"])

    # meal_items
    op.create_table(
        "meal_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("meal_entry_id", sa.Integer(), nullable=False),
        sa.Column("food_id", sa.Integer(), nullable=True),
        sa.Column("food_name", sa.String(200), nullable=False),
        sa.Column("quantity_g", sa.Float(), nullable=False),
        sa.Column("calories", sa.Float(), nullable=False, server_default="0"),
        sa.Column("protein_g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("carbs_g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("fat_g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("fiber_g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("was_edited", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["meal_entry_id"], ["meal_entries.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["food_id"], ["foods.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_meal_items_id", "meal_items", ["id"])
    op.create_index("ix_meal_items_meal_entry_id", "meal_items", ["meal_entry_id"])

    # daily_macros
    op.create_table(
        "daily_macros",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("total_calories", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_protein_g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_carbs_g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_fat_g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_fiber_g", sa.Float(), nullable=False, server_default="0"),
        sa.Column("meal_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_daily_macros_id", "daily_macros", ["id"])
    op.create_index("ix_daily_macros_user_id", "daily_macros", ["user_id"])
    op.create_index("ix_daily_macros_date", "daily_macros", ["date"])
    op.create_unique_constraint("uq_daily_macros_user_date", "daily_macros", ["user_id", "date"])

    # goals
    op.create_table(
        "goals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("profile_id", sa.Integer(), nullable=False),
        sa.Column("target_calories", sa.Float(), nullable=False),
        sa.Column("target_protein_g", sa.Float(), nullable=False),
        sa.Column("target_carbs_g", sa.Float(), nullable=False),
        sa.Column("target_fat_g", sa.Float(), nullable=False),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("effective_to", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_goals_id", "goals", ["id"])

    # weight_logs
    op.create_table(
        "weight_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("profile_id", sa.Integer(), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=False),
        sa.Column("logged_at", sa.Date(), nullable=False),
        sa.Column("notes", sa.String(300), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_weight_logs_id", "weight_logs", ["id"])
    op.create_index("ix_weight_logs_logged_at", "weight_logs", ["logged_at"])


def downgrade() -> None:
    op.drop_table("weight_logs")
    op.drop_table("goals")
    op.drop_table("daily_macros")
    op.drop_table("meal_items")
    op.drop_table("meal_entries")
    op.drop_table("foods")
    op.drop_table("profiles")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS sexenum")
    op.execute("DROP TYPE IF EXISTS activitylevelenum")
    op.execute("DROP TYPE IF EXISTS goaltypeenum")
    op.execute("DROP TYPE IF EXISTS mealtypeenum")
