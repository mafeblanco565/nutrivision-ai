from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
from app.models.meal import MealTypeEnum


class MealItemBase(BaseModel):
    food_name: str
    quantity_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float = 0.0


class MealItemCreate(MealItemBase):
    food_id: Optional[int] = None
    confidence: Optional[float] = None


class MealItemUpdate(BaseModel):
    food_name: Optional[str] = None
    quantity_g: Optional[float] = None


class MealItemResponse(MealItemBase):
    id: int
    meal_entry_id: int
    food_id: Optional[int]
    confidence: Optional[float]
    was_edited: bool
    deleted_at: Optional[datetime]

    model_config = {"from_attributes": True}


class MealEntryCreate(BaseModel):
    meal_type: MealTypeEnum = MealTypeEnum.lunch
    eaten_at: date
    notes: Optional[str] = None


class MealEntryResponse(BaseModel):
    id: int
    user_id: int
    meal_type: MealTypeEnum
    eaten_at: date
    image_url: Optional[str]
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    total_fiber_g: float
    ai_confidence: Optional[float]
    notes: Optional[str]
    is_manual: bool
    items: List[MealItemResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class DailyMacrosResponse(BaseModel):
    date: date
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    total_fiber_g: float
    meal_count: int
    # Compared to goals
    target_calories: Optional[float] = None
    target_protein_g: Optional[float] = None
    target_carbs_g: Optional[float] = None
    target_fat_g: Optional[float] = None
    calories_remaining: Optional[float] = None
    protein_remaining: Optional[float] = None

    model_config = {"from_attributes": True}


class WeeklyProgressResponse(BaseModel):
    days: List[DailyMacrosResponse]
    avg_calories: float
    avg_protein_g: float
    avg_carbs_g: float
    avg_fat_g: float
    days_on_target: int


class AIAnalysisResponse(BaseModel):
    meal_entry_id: int
    detected_foods: List[MealItemResponse]
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    confidence: float
    image_url: Optional[str]
