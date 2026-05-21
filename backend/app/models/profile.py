from sqlalchemy import String, Integer, Float, ForeignKey, Enum as SAEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin
from typing import Optional, TYPE_CHECKING
import enum

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.goal import Goal
    from app.models.weight_log import WeightLog


class SexEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class ActivityLevelEnum(str, enum.Enum):
    sedentary = "sedentary"           # 1.2
    lightly_active = "lightly_active" # 1.375
    moderately_active = "moderately_active"  # 1.55
    very_active = "very_active"       # 1.725
    extra_active = "extra_active"     # 1.9


ACTIVITY_MULTIPLIERS = {
    ActivityLevelEnum.sedentary: 1.2,
    ActivityLevelEnum.lightly_active: 1.375,
    ActivityLevelEnum.moderately_active: 1.55,
    ActivityLevelEnum.very_active: 1.725,
    ActivityLevelEnum.extra_active: 1.9,
}


class GoalTypeEnum(str, enum.Enum):
    lose_fat = "lose_fat"
    maintain = "maintain"
    gain_muscle = "gain_muscle"


class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Personal info
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    sex: Mapped[SexEnum] = mapped_column(SAEnum(SexEnum), nullable=False)
    height_cm: Mapped[float] = mapped_column(Float, nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    activity_level: Mapped[ActivityLevelEnum] = mapped_column(
        SAEnum(ActivityLevelEnum), nullable=False, default=ActivityLevelEnum.moderately_active
    )
    goal_type: Mapped[GoalTypeEnum] = mapped_column(
        SAEnum(GoalTypeEnum), nullable=False, default=GoalTypeEnum.maintain
    )

    # Calculated nutrition targets (stored for quick access)
    bmr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tdee: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_calories: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_protein_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_carbs_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_fat_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # i18n / preferences
    locale: Mapped[str] = mapped_column(String(10), default="es", nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")
    goals: Mapped[list["Goal"]] = relationship(
        "Goal", back_populates="profile", cascade="all, delete-orphan"
    )
    weight_logs: Mapped[list["WeightLog"]] = relationship(
        "WeightLog", back_populates="profile", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Profile user_id={self.user_id} name={self.full_name}>"
