from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.user import User


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_id(self, id: int) -> Optional[User]:
        result = await self.db.execute(
            select(User)
            .where(User.id == id)
            .options(selectinload(User.profile))
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(
            select(User)
            .where(User.email == email)
            .options(selectinload(User.profile))
        )
        return result.scalar_one_or_none()

    async def get_by_supabase_id(self, supabase_id: str) -> Optional[User]:
        result = await self.db.execute(
            select(User)
            .where(User.supabase_id == supabase_id)
            .options(selectinload(User.profile))
        )
        return result.scalar_one_or_none()

    async def email_exists(self, email: str) -> bool:
        return await self.get_by_email(email) is not None
