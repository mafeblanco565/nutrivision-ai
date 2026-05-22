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
    is_manual: bool = False


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


# Draft item used in the analyze-only / review flow (no DB id yet)
class FoodItemDraft(BaseModel):
    food_name: str
    quantity_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float = 0.0
    confidence: float = 0.0
    is_manual: bool = False


class AnalysisPreviewResponse(BaseModel):
    """Returned by /analyze-only — foods detected but NOT saved yet."""
    detected_foods: List[FoodItemDraft]
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    confidence: float
    raw_response: Optional[str] = None


class SaveMealRequest(BaseModel):
    """Sent by frontend after user reviews/edits the detected foods."""
    meal_type: MealTypeEnum = MealTypeEnum.lunch
    eaten_at: date
    items: List[FoodItemDraft]
    ai_raw_response: Optional[str] = None
    ai_confidence: Optional[float] = None


class MealEntryCreate(BaseModel):
    meal_type: MealTypeEnum = MealTypeEnum.lunch
    eaten_at: date
    notes: Optional[str] = None


class MealEntryUpdate(BaseModel):
    meal_type: Optional[MealTypeEnum] = None
    eaten_at: Optional[date] = None
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
