"""
Seed script — populates database with sample food data and a demo user.
Run: python scripts/seed.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import *
from app.db.base import Base
from datetime import date

SAMPLE_FOODS = [
    {"name": "Pollo a la plancha", "name_es": "Pollo a la plancha", "calories_per_100g": 165, "protein_per_100g": 31, "carbs_per_100g": 0, "fat_per_100g": 3.6, "category": "Proteínas"},
    {"name": "Arroz blanco cocido", "name_es": "Arroz blanco", "calories_per_100g": 130, "protein_per_100g": 2.7, "carbs_per_100g": 28.2, "fat_per_100g": 0.3, "category": "Cereales"},
    {"name": "Huevo entero", "name_es": "Huevo", "calories_per_100g": 155, "protein_per_100g": 13, "carbs_per_100g": 1.1, "fat_per_100g": 11, "category": "Proteínas"},
    {"name": "Aguacate", "name_es": "Aguacate", "calories_per_100g": 160, "protein_per_100g": 2, "carbs_per_100g": 8.5, "fat_per_100g": 14.7, "category": "Grasas saludables"},
    {"name": "Batata/Boniato cocido", "name_es": "Batata", "calories_per_100g": 86, "protein_per_100g": 1.6, "carbs_per_100g": 20.1, "fat_per_100g": 0.1, "category": "Cereales"},
    {"name": "Salmón a la plancha", "name_es": "Salmón", "calories_per_100g": 208, "protein_per_100g": 20, "carbs_per_100g": 0, "fat_per_100g": 13, "category": "Proteínas"},
    {"name": "Brócoli cocido", "name_es": "Brócoli", "calories_per_100g": 35, "protein_per_100g": 2.4, "carbs_per_100g": 7.2, "fat_per_100g": 0.4, "fiber_per_100g": 2.6, "category": "Verduras"},
    {"name": "Plátano", "name_es": "Plátano", "calories_per_100g": 89, "protein_per_100g": 1.1, "carbs_per_100g": 23, "fat_per_100g": 0.3, "fiber_per_100g": 2.6, "category": "Frutas"},
    {"name": "Yogur griego 0%", "name_es": "Yogur griego", "calories_per_100g": 59, "protein_per_100g": 10, "carbs_per_100g": 3.6, "fat_per_100g": 0.4, "category": "Lácteos"},
    {"name": "Avena cocida", "name_es": "Avena", "calories_per_100g": 71, "protein_per_100g": 2.5, "carbs_per_100g": 12, "fat_per_100g": 1.4, "fiber_per_100g": 1.7, "category": "Cereales"},
    {"name": "Pechuga de pavo", "name_es": "Pechuga de pavo", "calories_per_100g": 135, "protein_per_100g": 29.9, "carbs_per_100g": 0, "fat_per_100g": 1.8, "category": "Proteínas"},
    {"name": "Atún en agua", "name_es": "Atún", "calories_per_100g": 116, "protein_per_100g": 25.5, "carbs_per_100g": 0, "fat_per_100g": 0.8, "category": "Proteínas"},
    {"name": "Almendras", "name_es": "Almendras", "calories_per_100g": 579, "protein_per_100g": 21, "carbs_per_100g": 22, "fat_per_100g": 50, "category": "Frutos secos"},
    {"name": "Manzana", "name_es": "Manzana", "calories_per_100g": 52, "protein_per_100g": 0.3, "carbs_per_100g": 14, "fat_per_100g": 0.2, "fiber_per_100g": 2.4, "category": "Frutas"},
    {"name": "Pasta integral cocida", "name_es": "Pasta integral", "calories_per_100g": 124, "protein_per_100g": 5.3, "carbs_per_100g": 26, "fat_per_100g": 0.8, "fiber_per_100g": 3.6, "category": "Cereales"},
]


async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as db:
        # Seed foods
        for food_data in SAMPLE_FOODS:
            food = Food(
                name=food_data["name"],
                name_es=food_data.get("name_es"),
                calories_per_100g=food_data["calories_per_100g"],
                protein_per_100g=food_data["protein_per_100g"],
                carbs_per_100g=food_data["carbs_per_100g"],
                fat_per_100g=food_data["fat_per_100g"],
                fiber_per_100g=food_data.get("fiber_per_100g", 0),
                category=food_data.get("category"),
                is_verified=True,
            )
            db.add(food)

        # Create demo user
        demo_user = User(
            email="demo@nutrivision.ai",
            hashed_password=get_password_hash("demo1234"),
            is_active=True,
            is_verified=True,
        )
        db.add(demo_user)
        await db.flush()

        # Create demo profile
        from app.services.nutrition import calculate_nutrition_targets
        from app.models.profile import SexEnum, ActivityLevelEnum, GoalTypeEnum

        targets = calculate_nutrition_targets(
            weight_kg=75, height_cm=175, age=28,
            sex=SexEnum.male,
            activity_level=ActivityLevelEnum.moderately_active,
            goal_type=GoalTypeEnum.maintain,
        )

        profile = Profile(
            user_id=demo_user.id,
            full_name="Usuario Demo",
            age=28,
            sex=SexEnum.male,
            height_cm=175,
            weight_kg=75,
            activity_level=ActivityLevelEnum.moderately_active,
            goal_type=GoalTypeEnum.maintain,
            bmr=targets.bmr,
            tdee=targets.tdee,
            target_calories=targets.target_calories,
            target_protein_g=targets.target_protein_g,
            target_carbs_g=targets.target_carbs_g,
            target_fat_g=targets.target_fat_g,
        )
        db.add(profile)
        await db.commit()

    print("Seed completado:")
    print(f"  - {len(SAMPLE_FOODS)} alimentos insertados")
    print(f"  - Usuario demo: demo@nutrivision.ai / demo1234")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
