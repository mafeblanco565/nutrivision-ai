from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session_factory
from app.core.security import verify_supabase_token
from app.repositories.user import UserRepository
from app.models.user import User

bearer_scheme = HTTPBearer()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_supabase_token(credentials.credentials)
    if not payload:
        raise credentials_exception

    supabase_id: Optional[str] = payload.get("sub")
    email: Optional[str] = payload.get("email")

    if not supabase_id or not email:
        raise credentials_exception

    user_repo = UserRepository(db)
    user = await user_repo.get_by_supabase_id(supabase_id)

    if not user:
        # First login — auto-create user record
        user = User(
            supabase_id=supabase_id,
            email=email,
            is_active=True,
            is_verified=True,
        )
        await user_repo.create(user)
        # Reload with relationships eagerly loaded
        user = await user_repo.get_by_supabase_id(supabase_id)

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
