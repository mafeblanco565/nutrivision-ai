from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.models.profile import SexEnum, ActivityLevelEnum, GoalTypeEnum


class ProfileCreate(BaseModel):
    full_name: str
    age: int
    sex: SexEnum
    height_cm: float
    weight_kg: float
    activity_level: ActivityLevelEnum
    goal_type: GoalTypeEnum
    locale: str = "es"
    timezone: str = "UTC"

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int) -> int:
        if not 10 <= v <= 120:
            raise ValueError("Age must be between 10 and 120")
        return v

    @field_validator("height_cm")
    @classmethod
    def validate_height(cls, v: float) -> float:
        if not 50 <= v <= 300:
            raise ValueError("Height must be between 50 and 300 cm")
        return v

    @field_validator("weight_kg")
    @classmethod
    def validate_weight(cls, v: float) -> float:
        if not 20 <= v <= 500:
            raise ValueError("Weight must be between 20 and 500 kg")
        return v


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[ActivityLevelEnum] = None
    goal_type: Optional[GoalTypeEnum] = None
    locale: Optional[str] = None
    timezone: Optional[str] = None


class NutritionTargets(BaseModel):
    bmr: float
    tdee: float
    target_calories: float
    target_protein_g: float
    target_carbs_g: float
    target_fat_g: float


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    age: int
    sex: SexEnum
    height_cm: float
    weight_kg: float
    activity_level: ActivityLevelEnum
    goal_type: GoalTypeEnum
    bmr: Optional[float]
    tdee: Optional[float]
    target_calories: Optional[float]
    target_protein_g: Optional[float]
    target_carbs_g: Optional[float]
    target_fat_g: Optional[float]
    locale: str
    timezone: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
