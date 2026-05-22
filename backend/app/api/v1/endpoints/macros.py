from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta
from typing import List, Optional
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.repositories.meal import DailyMacrosRepository
from app.schemas.meal import DailyMacrosResponse, WeeklyProgressResponse
from app.services.nutrition import generate_recommendations

router = APIRouter(prefix="/macros", tags=["macros"])


@router.get("/today", response_model=DailyMacrosResponse)
async def get_today_macros(
    client_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.fromisoformat(client_date) if client_date else date.today()
    repo = DailyMacrosRepository(db)
    daily = await repo.get_by_user_and_date(current_user.id, today)

    profile = current_user.profile
    response = DailyMacrosResponse(
        date=today,
        total_calories=daily.total_calories if daily else 0.0,
        total_protein_g=daily.total_protein_g if daily else 0.0,
        total_carbs_g=daily.total_carbs_g if daily else 0.0,
        total_fat_g=daily.total_fat_g if daily else 0.0,
        total_fiber_g=daily.total_fiber_g if daily else 0.0,
        meal_count=daily.meal_count if daily else 0,
    )

    if profile:
        response.target_calories = profile.target_calories
        response.target_protein_g = profile.target_protein_g
        response.target_carbs_g = profile.target_carbs_g
        response.target_fat_g = profile.target_fat_g
        response.calories_remaining = (profile.target_calories or 0) - response.total_calories
        response.protein_remaining = (profile.target_protein_g or 0) - response.total_protein_g

    return response


@router.get("/weekly", response_model=WeeklyProgressResponse)
async def get_weekly_progress(
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end = end_date or date.today()
    start = end - timedelta(days=6)

    repo = DailyMacrosRepository(db)
    records = await repo.get_range(current_user.id, start, end)

    records_by_date = {r.date: r for r in records}
    profile = current_user.profile

    days = []
    for i in range(7):
        d = start + timedelta(days=i)
        record = records_by_date.get(d)
        day_data = DailyMacrosResponse(
            date=d,
            total_calories=record.total_calories if record else 0.0,
            total_protein_g=record.total_protein_g if record else 0.0,
            total_carbs_g=record.total_carbs_g if record else 0.0,
            total_fat_g=record.total_fat_g if record else 0.0,
            total_fiber_g=record.total_fiber_g if record else 0.0,
            meal_count=record.meal_count if record else 0,
            target_calories=profile.target_calories if profile else None,
            target_protein_g=profile.target_protein_g if profile else None,
        )
        days.append(day_data)

    avg_calories = sum(d.total_calories for d in days) / 7
    avg_protein = sum(d.total_protein_g for d in days) / 7
    avg_carbs = sum(d.total_carbs_g for d in days) / 7
    avg_fat = sum(d.total_fat_g for d in days) / 7

    days_on_target = 0
    if profile and profile.target_calories:
        days_on_target = sum(
            1 for d in days
            if abs(d.total_calories - profile.target_calories) <= profile.target_calories * 0.1
        )

    return WeeklyProgressResponse(
        days=days,
        avg_calories=round(avg_calories, 1),
        avg_protein_g=round(avg_protein, 1),
        avg_carbs_g=round(avg_carbs, 1),
        avg_fat_g=round(avg_fat, 1),
        days_on_target=days_on_target,
    )


@router.get("/date/{target_date}", response_model=DailyMacrosResponse)
async def get_macros_by_date(
    target_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = DailyMacrosRepository(db)
    daily = await repo.get_by_user_and_date(current_user.id, target_date)

    profile = current_user.profile
    response = DailyMacrosResponse(
        date=target_date,
        total_calories=daily.total_calories if daily else 0.0,
        total_protein_g=daily.total_protein_g if daily else 0.0,
        total_carbs_g=daily.total_carbs_g if daily else 0.0,
        total_fat_g=daily.total_fat_g if daily else 0.0,
        total_fiber_g=daily.total_fiber_g if daily else 0.0,
        meal_count=daily.meal_count if daily else 0,
    )

    if profile:
        response.target_calories = profile.target_calories
        response.target_protein_g = profile.target_protein_g
        response.target_carbs_g = profile.target_carbs_g
        response.target_fat_g = profile.target_fat_g
        response.calories_remaining = (profile.target_calories or 0) - response.total_calories
        response.protein_remaining = (profile.target_protein_g or 0) - response.total_protein_g

    return response


@router.get("/recommendations")
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DailyMacrosRepository(db)
    daily = await repo.get_by_user_and_date(current_user.id, date.today())
    profile = current_user.profile

    if not profile:
        return {"recommendations": ["Completa tu perfil para obtener recomendaciones personalizadas."]}

    recs = generate_recommendations(
        consumed_calories=daily.total_calories if daily else 0,
        consumed_protein=daily.total_protein_g if daily else 0,
        consumed_carbs=daily.total_carbs_g if daily else 0,
        consumed_fat=daily.total_fat_g if daily else 0,
        target_calories=profile.target_calories or 2000,
        target_protein=profile.target_protein_g or 150,
        target_carbs=profile.target_carbs_g or 200,
        target_fat=profile.target_fat_g or 65,
    )

    return {"recommendations": recs}
