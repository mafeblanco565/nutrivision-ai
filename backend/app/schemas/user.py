from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    is_verified: bool
    is_premium: bool
    created_at: datetime
    has_profile: bool = False

    model_config = {"from_attributes": True}
