from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.repositories.base import BaseRepository
from app.models.food import Food


class FoodRepository(BaseRepository[Food]):
    def __init__(self, db: AsyncSession):
        super().__init__(Food, db)

    async def search(self, query: str, limit: int = 20) -> List[Food]:
        """Case-insensitive partial match on name and name_es."""
        pattern = f"%{query.lower()}%"
        result = await self.db.execute(
            select(Food)
            .where(
                or_(
                    Food.name.ilike(pattern),
                    Food.name_es.ilike(pattern),
                )
            )
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_logmeal_id(self, logmeal_id: str) -> Optional[Food]:
        result = await self.db.execute(
            select(Food).where(Food.logmeal_id == logmeal_id)
        )
        return result.scalar_one_or_none()
