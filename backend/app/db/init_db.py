"""
Creates all tables directly from SQLAlchemy metadata.
Only use in development/testing. In production, use Alembic migrations.
"""
import asyncio
from app.db.session import engine
from app.db.base import Base
from app.models import *  # noqa: ensure all models are registered


async def create_all() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("All tables created.")


async def drop_all() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("All tables dropped.")


if __name__ == "__main__":
    asyncio.run(create_all())
