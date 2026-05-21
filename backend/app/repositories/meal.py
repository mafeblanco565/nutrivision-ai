from typing import Optional, List
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.meal import MealEntry, MealItem, DailyMacros


class MealRepository(BaseRepository[MealEntry]):
    def __init__(self, db: AsyncSession):
        super().__init__(MealEntry, db)

    async def get_by_user_and_date(self, user_id: int, date: date) -> List[MealEntry]:
        result = await self.db.execute(
            select(MealEntry)
            .where(
                and_(
                    MealEntry.user_id == user_id,
                    MealEntry.eaten_at == date,
                    MealEntry.deleted_at.is_(None),
                )
            )
            .options(selectinload(MealEntry.items))
            .order_by(MealEntry.created_at)
        )
        return list(result.scalars().all())

    async def get_with_items(self, meal_id: int, user_id: int) -> Optional[MealEntry]:
        result = await self.db.execute(
            select(MealEntry)
            .where(
                and_(
                    MealEntry.id == meal_id,
                    MealEntry.user_id == user_id,
                    MealEntry.deleted_at.is_(None),
                )
            )
            .options(selectinload(MealEntry.items))
        )
        return result.scalar_one_or_none()

    async def get_user_meals_paginated(
        self, user_id: int, skip: int = 0, limit: int = 20
    ) -> List[MealEntry]:
        result = await self.db.execute(
            select(MealEntry)
            .where(
                and_(
                    MealEntry.user_id == user_id,
                    MealEntry.deleted_at.is_(None),
                )
            )
            .options(selectinload(MealEntry.items))
            .order_by(MealEntry.eaten_at.desc(), MealEntry.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


class DailyMacrosRepository(BaseRepository[DailyMacros]):
    def __init__(self, db: AsyncSession):
        super().__init__(DailyMacros, db)

    async def get_by_user_and_date(self, user_id: int, date: date) -> Optional[DailyMacros]:
        result = await self.db.execute(
            select(DailyMacros).where(
                and_(DailyMacros.user_id == user_id, DailyMacros.date == date)
            )
        )
        return result.scalar_one_or_none()

    async def get_range(self, user_id: int, start: date, end: date) -> List[DailyMacros]:
        result = await self.db.execute(
            select(DailyMacros)
            .where(
                and_(
                    DailyMacros.user_id == user_id,
                    DailyMacros.date >= start,
                    DailyMacros.date <= end,
                )
            )
            .order_by(DailyMacros.date)
        )
        return list(result.scalars().all())

    async def upsert_daily(self, user_id: int, date: date, db: AsyncSession) -> DailyMacros:
        """Recalculate and upsert daily macros from all active meal entries."""
        from app.models.meal import MealEntry

        # Sum from all active meal entries for the day
        result = await db.execute(
            select(
                func.coalesce(func.sum(MealEntry.total_calories), 0).label("calories"),
                func.coalesce(func.sum(MealEntry.total_protein_g), 0).label("protein"),
                func.coalesce(func.sum(MealEntry.total_carbs_g), 0).label("carbs"),
                func.coalesce(func.sum(MealEntry.total_fat_g), 0).label("fat"),
                func.coalesce(func.sum(MealEntry.total_fiber_g), 0).label("fiber"),
                func.count(MealEntry.id).label("count"),
            ).where(
                and_(
                    MealEntry.user_id == user_id,
                    MealEntry.eaten_at == date,
                    MealEntry.deleted_at.is_(None),
                )
            )
        )
        row = result.one()

        daily = await self.get_by_user_and_date(user_id, date)
        if not daily:
            daily = DailyMacros(user_id=user_id, date=date)
            db.add(daily)

        daily.total_calories = float(row.calories)
        daily.total_protein_g = float(row.protein)
        daily.total_carbs_g = float(row.carbs)
        daily.total_fat_g = float(row.fat)
        daily.total_fiber_g = float(row.fiber)
        daily.meal_count = int(row.count)

        await db.flush()
        await db.refresh(daily)
        return daily
