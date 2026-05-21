from sqlalchemy import String, Integer, Float, ForeignKey, Text, Enum as SAEnum, Date, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, SoftDeleteMixin
from typing import Optional, List, TYPE_CHECKING
from datetime import date
import enum

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.food import Food


class MealTypeEnum(str, enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


class MealEntry(Base, TimestampMixin, SoftDeleteMixin):
    """A single meal photo/analysis session."""
    __tablename__ = "meal_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    meal_type: Mapped[MealTypeEnum] = mapped_column(
        SAEnum(MealTypeEnum), nullable=False, default=MealTypeEnum.lunch
    )
    eaten_at: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # Image storage
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # AI analysis raw response (stored for debugging / re-processing)
    ai_raw_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Aggregated totals (denormalized for performance)
    total_calories: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_protein_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_carbs_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_fat_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_fiber_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_manual: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="meal_entries")
    items: Mapped[List["MealItem"]] = relationship(
        "MealItem", back_populates="meal_entry", cascade="all, delete-orphan"
    )

    def recalculate_totals(self) -> None:
        self.total_calories = sum(item.calories for item in self.items if not item.is_deleted)
        self.total_protein_g = sum(item.protein_g for item in self.items if not item.is_deleted)
        self.total_carbs_g = sum(item.carbs_g for item in self.items if not item.is_deleted)
        self.total_fat_g = sum(item.fat_g for item in self.items if not item.is_deleted)
        self.total_fiber_g = sum(item.fiber_g for item in self.items if not item.is_deleted)


class MealItem(Base, TimestampMixin, SoftDeleteMixin):
    """Individual food item within a meal entry."""
    __tablename__ = "meal_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meal_entry_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meal_entries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    food_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("foods.id", ondelete="SET NULL"), nullable=True
    )

    # The name as detected / entered
    food_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity_g: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)

    # Macros (calculated from quantity_g)
    calories: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    protein_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    carbs_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fat_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fiber_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # AI confidence for this specific food
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    was_edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    meal_entry: Mapped["MealEntry"] = relationship("MealEntry", back_populates="items")
    food: Mapped[Optional["Food"]] = relationship("Food")


class DailyMacros(Base, TimestampMixin):
    """Aggregated daily nutrition summary per user. Recalculated on each meal update."""
    __tablename__ = "daily_macros"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    total_calories: Mapped[float] = mapped_column(Float, default=0.0)
    total_protein_g: Mapped[float] = mapped_column(Float, default=0.0)
    total_carbs_g: Mapped[float] = mapped_column(Float, default=0.0)
    total_fat_g: Mapped[float] = mapped_column(Float, default=0.0)
    total_fiber_g: Mapped[float] = mapped_column(Float, default=0.0)
    meal_count: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (
        # Composite unique index: one record per user per day
        {"schema": None},
    )
