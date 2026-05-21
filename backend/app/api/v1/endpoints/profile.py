from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.services.nutrition import calculate_nutrition_targets

router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: ProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.profile:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Profile already exists")

    targets = calculate_nutrition_targets(
        weight_kg=payload.weight_kg,
        height_cm=payload.height_cm,
        age=payload.age,
        sex=payload.sex,
        activity_level=payload.activity_level,
        goal_type=payload.goal_type,
    )

    profile = Profile(
        user_id=current_user.id,
        full_name=payload.full_name,
        age=payload.age,
        sex=payload.sex,
        height_cm=payload.height_cm,
        weight_kg=payload.weight_kg,
        activity_level=payload.activity_level,
        goal_type=payload.goal_type,
        locale=payload.locale,
        timezone=payload.timezone,
        bmr=targets.bmr,
        tdee=targets.tdee,
        target_calories=targets.target_calories,
        target_protein_g=targets.target_protein_g,
        target_carbs_g=targets.target_carbs_g,
        target_fat_g=targets.target_fat_g,
    )

    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return profile


@router.get("", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    if not current_user.profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return current_user.profile


@router.patch("", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    # Recalculate targets if relevant fields changed
    nutrition_fields = {"weight_kg", "height_cm", "age", "sex", "activity_level", "goal_type"}
    if nutrition_fields & set(update_data.keys()):
        targets = calculate_nutrition_targets(
            weight_kg=profile.weight_kg,
            height_cm=profile.height_cm,
            age=profile.age,
            sex=profile.sex,
            activity_level=profile.activity_level,
            goal_type=profile.goal_type,
        )
        profile.bmr = targets.bmr
        profile.tdee = targets.tdee
        profile.target_calories = targets.target_calories
        profile.target_protein_g = targets.target_protein_g
        profile.target_carbs_g = targets.target_carbs_g
        profile.target_fat_g = targets.target_fat_g

    await db.flush()
    await db.refresh(profile)
    return profile
