from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime
from typing import Optional, List
from app.core.deps import get_db, get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.meal import MealEntry, MealItem, MealTypeEnum
from app.repositories.meal import MealRepository, DailyMacrosRepository
from app.schemas.meal import (
    MealEntryResponse, AIAnalysisResponse, MealItemUpdate, DailyMacrosResponse,
    AnalysisPreviewResponse, SaveMealRequest, FoodItemDraft, MealEntryUpdate,
)
from app.services.ai_vision import get_vision_provider

router = APIRouter(prefix="/meals", tags=["meals"])

VALID_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/analyze", response_model=AIAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def analyze_meal_image(
    image: UploadFile = File(...),
    meal_type: MealTypeEnum = Form(MealTypeEnum.lunch),
    eaten_at: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate image
    if image.content_type not in VALID_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid image type. Allowed: {', '.join(VALID_IMAGE_TYPES)}"
        )

    image_bytes = await image.read()
    if len(image_bytes) > settings.max_image_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image too large. Max: {settings.MAX_IMAGE_SIZE_MB}MB"
        )

    meal_date = date.fromisoformat(eaten_at) if eaten_at else date.today()

    # AI analysis
    provider = get_vision_provider()
    analysis = await provider.analyze_image(image_bytes, image.content_type)

    if analysis.error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI analysis failed: {analysis.error}"
        )

    # Create meal entry
    meal_entry = MealEntry(
        user_id=current_user.id,
        meal_type=meal_type,
        eaten_at=meal_date,
        ai_raw_response=analysis.raw_response,
        ai_confidence=analysis.confidence,
        total_calories=analysis.total_calories,
        total_protein_g=analysis.total_protein_g,
        total_carbs_g=analysis.total_carbs_g,
        total_fat_g=analysis.total_fat_g,
        total_fiber_g=analysis.total_fiber_g,
    )
    db.add(meal_entry)
    await db.flush()

    # Create meal items
    items = []
    for food in analysis.foods:
        item = MealItem(
            meal_entry_id=meal_entry.id,
            food_name=food.name,
            quantity_g=food.quantity_g,
            calories=food.calories,
            protein_g=food.protein_g,
            carbs_g=food.carbs_g,
            fat_g=food.fat_g,
            fiber_g=food.fiber_g,
            confidence=food.confidence,
        )
        db.add(item)
        items.append(item)

    await db.flush()
    # Refresh each item to get DB-assigned IDs and defaults
    for item in items:
        await db.refresh(item)
    await db.refresh(meal_entry)

    # Update daily totals
    daily_repo = DailyMacrosRepository(db)
    await daily_repo.upsert_daily(current_user.id, meal_date, db)

    await db.commit()

    return AIAnalysisResponse(
        meal_entry_id=meal_entry.id,
        detected_foods=items,
        total_calories=analysis.total_calories,
        total_protein_g=analysis.total_protein_g,
        total_carbs_g=analysis.total_carbs_g,
        total_fat_g=analysis.total_fat_g,
        confidence=analysis.confidence,
        image_url=meal_entry.image_url,
    )


@router.post("/analyze-only", response_model=AnalysisPreviewResponse)
async def analyze_meal_image_only(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Analyze an image and return detected foods WITHOUT saving to the database."""
    if image.content_type not in VALID_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid image type. Allowed: {', '.join(VALID_IMAGE_TYPES)}"
        )
    image_bytes = await image.read()
    if len(image_bytes) > settings.max_image_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image too large. Max: {settings.MAX_IMAGE_SIZE_MB}MB"
        )

    provider = get_vision_provider()
    analysis = await provider.analyze_image(image_bytes, image.content_type)

    if analysis.error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI analysis failed: {analysis.error}"
        )

    foods = [
        FoodItemDraft(
            food_name=f.name,
            quantity_g=f.quantity_g,
            calories=f.calories,
            protein_g=f.protein_g,
            carbs_g=f.carbs_g,
            fat_g=f.fat_g,
            fiber_g=f.fiber_g,
            confidence=f.confidence,
        )
        for f in analysis.foods
    ]

    return AnalysisPreviewResponse(
        detected_foods=foods,
        total_calories=analysis.total_calories,
        total_protein_g=analysis.total_protein_g,
        total_carbs_g=analysis.total_carbs_g,
        total_fat_g=analysis.total_fat_g,
        confidence=analysis.confidence,
        raw_response=analysis.raw_response,
    )


@router.post("", response_model=MealEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_meal(
    payload: SaveMealRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a reviewed/edited meal (from AI analysis or manual entry)."""
    total_calories = sum(i.calories for i in payload.items)
    total_protein = sum(i.protein_g for i in payload.items)
    total_carbs = sum(i.carbs_g for i in payload.items)
    total_fat = sum(i.fat_g for i in payload.items)
    total_fiber = sum(i.fiber_g for i in payload.items)
    is_manual = all(i.is_manual for i in payload.items)

    meal_entry = MealEntry(
        user_id=current_user.id,
        meal_type=payload.meal_type,
        eaten_at=payload.eaten_at,
        ai_raw_response=payload.ai_raw_response,
        ai_confidence=payload.ai_confidence,
        total_calories=total_calories,
        total_protein_g=total_protein,
        total_carbs_g=total_carbs,
        total_fat_g=total_fat,
        total_fiber_g=total_fiber,
        is_manual=is_manual,
    )
    db.add(meal_entry)
    await db.flush()

    items = []
    for food in payload.items:
        item = MealItem(
            meal_entry_id=meal_entry.id,
            food_name=food.food_name,
            quantity_g=food.quantity_g,
            calories=food.calories,
            protein_g=food.protein_g,
            carbs_g=food.carbs_g,
            fat_g=food.fat_g,
            fiber_g=food.fiber_g,
            confidence=food.confidence if not food.is_manual else None,
            was_edited=food.is_manual,
        )
        db.add(item)
        items.append(item)

    await db.flush()
    for item in items:
        await db.refresh(item)
    await db.refresh(meal_entry)

    daily_repo = DailyMacrosRepository(db)
    await daily_repo.upsert_daily(current_user.id, payload.eaten_at, db)

    await db.commit()
    return meal_entry


@router.post("/{meal_id}/items", response_model=MealEntryResponse)
async def add_meal_item(
    meal_id: int,
    item_data: FoodItemDraft,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a manual food item to an existing meal."""
    repo = MealRepository(db)
    meal = await repo.get_with_items(meal_id, current_user.id)
    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")

    item = MealItem(
        meal_entry_id=meal.id,
        food_name=item_data.food_name,
        quantity_g=item_data.quantity_g,
        calories=item_data.calories,
        protein_g=item_data.protein_g,
        carbs_g=item_data.carbs_g,
        fat_g=item_data.fat_g,
        fiber_g=item_data.fiber_g,
        confidence=None,
        was_edited=True,
    )
    db.add(item)
    await db.flush()
    meal.recalculate_totals()
    await db.flush()

    daily_repo = DailyMacrosRepository(db)
    await daily_repo.upsert_daily(current_user.id, meal.eaten_at, db)
    await db.commit()
    await db.refresh(meal)
    return meal


@router.patch("/{meal_id}", response_model=MealEntryResponse)
async def update_meal(
    meal_id: int,
    payload: MealEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update meal type, date, or notes."""
    repo = MealRepository(db)
    meal = await repo.get_with_items(meal_id, current_user.id)
    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")

    old_date = meal.eaten_at
    if payload.meal_type is not None:
        meal.meal_type = payload.meal_type
    if payload.eaten_at is not None:
        meal.eaten_at = payload.eaten_at
    if payload.notes is not None:
        meal.notes = payload.notes

    await db.flush()

    daily_repo = DailyMacrosRepository(db)
    await daily_repo.upsert_daily(current_user.id, old_date, db)
    if payload.eaten_at and payload.eaten_at != old_date:
        await daily_repo.upsert_daily(current_user.id, payload.eaten_at, db)

    await db.commit()
    await db.refresh(meal)
    return meal


@router.get("/today", response_model=List[MealEntryResponse])
async def get_today_meals(
    client_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.fromisoformat(client_date) if client_date else date.today()
    repo = MealRepository(db)
    meals = await repo.get_by_user_and_date(current_user.id, today)
    return meals


@router.get("/date/{meal_date}", response_model=List[MealEntryResponse])
async def get_meals_by_date(
    meal_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = MealRepository(db)
    meals = await repo.get_by_user_and_date(current_user.id, meal_date)
    return meals


@router.get("/{meal_id}", response_model=MealEntryResponse)
async def get_meal(
    meal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = MealRepository(db)
    meal = await repo.get_with_items(meal_id, current_user.id)
    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")
    return meal


@router.patch("/{meal_id}/items/{item_id}", response_model=MealEntryResponse)
async def update_meal_item(
    meal_id: int,
    item_id: int,
    payload: MealItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = MealRepository(db)
    meal = await repo.get_with_items(meal_id, current_user.id)
    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")

    item = next((i for i in meal.items if i.id == item_id and not i.is_deleted), None)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    if payload.food_name:
        item.food_name = payload.food_name

    if payload.quantity_g is not None:
        # Recalculate macros proportionally based on new grams
        ratio = payload.quantity_g / (item.quantity_g or 100)
        item.calories = round(item.calories * ratio, 1)
        item.protein_g = round(item.protein_g * ratio, 1)
        item.carbs_g = round(item.carbs_g * ratio, 1)
        item.fat_g = round(item.fat_g * ratio, 1)
        item.fiber_g = round(item.fiber_g * ratio, 1)
        item.quantity_g = payload.quantity_g

    item.was_edited = True
    meal.recalculate_totals()
    await db.flush()

    # Update daily totals
    daily_repo = DailyMacrosRepository(db)
    await daily_repo.upsert_daily(current_user.id, meal.eaten_at, db)
    await db.refresh(meal)
    return meal


@router.delete("/{meal_id}/items/{item_id}", response_model=MealEntryResponse)
async def delete_meal_item(
    meal_id: int,
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime, timezone
    repo = MealRepository(db)
    meal = await repo.get_with_items(meal_id, current_user.id)
    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")

    item = next((i for i in meal.items if i.id == item_id and not i.is_deleted), None)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    item.deleted_at = datetime.now(timezone.utc)
    meal.recalculate_totals()
    await db.flush()

    daily_repo = DailyMacrosRepository(db)
    await daily_repo.upsert_daily(current_user.id, meal.eaten_at, db)
    await db.refresh(meal)
    return meal


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meal(
    meal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime, timezone
    repo = MealRepository(db)
    meal = await repo.get_with_items(meal_id, current_user.id)
    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")

    meal.deleted_at = datetime.now(timezone.utc)
    await db.flush()

    daily_repo = DailyMacrosRepository(db)
    await daily_repo.upsert_daily(current_user.id, meal.eaten_at, db)
