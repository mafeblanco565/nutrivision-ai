from sqlalchemy import String, Integer, Float, Boolean, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin


class Food(Base, TimestampMixin):
    """Master food database. Populated from LogMeal responses + manual entries."""
    __tablename__ = "foods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Identifiers
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    name_es: Mapped[str | None] = mapped_column(String(200), nullable=True)
    logmeal_id: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)

    # Macros per 100g
    calories_per_100g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    protein_per_100g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    carbs_per_100g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fat_per_100g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fiber_per_100g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    sugar_per_100g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    sodium_per_100g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Category
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    __table_args__ = (
        Index("ix_foods_name_lower", "name"),
    )
