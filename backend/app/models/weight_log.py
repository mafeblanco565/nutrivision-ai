from sqlalchemy import Integer, Float, ForeignKey, Date, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin
from typing import Optional, TYPE_CHECKING
from datetime import date

if TYPE_CHECKING:
    from app.models.profile import Profile


class WeightLog(Base, TimestampMixin):
    __tablename__ = "weight_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )

    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    logged_at: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)

    profile: Mapped["Profile"] = relationship("Profile", back_populates="weight_logs")
