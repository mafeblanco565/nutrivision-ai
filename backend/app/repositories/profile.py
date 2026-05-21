from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.profile import Profile


class ProfileRepository(BaseRepository[Profile]):
    def __init__(self, db: AsyncSession):
        super().__init__(Profile, db)

    async def get_by_user_id(self, user_id: int) -> Optional[Profile]:
        result = await self.db.execute(
            select(Profile)
            .where(Profile.user_id == user_id)
            .options(selectinload(Profile.goals), selectinload(Profile.weight_logs))
        )
        return result.scalar_one_or_none()
