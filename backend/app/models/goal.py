from sqlalchemy import Integer, Float, ForeignKey, Boolean, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin
from typing import Optional, TYPE_CHECKING
from datetime import date

if TYPE_CHECKING:
    from app.models.profile import Profile


class Goal(Base, TimestampMixin):
    """Dynamic nutrition goals that can change over time."""
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )

    target_calories: Mapped[float] = mapped_column(Float, nullable=False)
    target_protein_g: Mapped[float] = mapped_column(Float, nullable=False)
    target_carbs_g: Mapped[float] = mapped_column(Float, nullable=False)
    target_fat_g: Mapped[float] = mapped_column(Float, nullable=False)

    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    profile: Mapped["Profile"] = relationship("Profile", back_populates="goals")
