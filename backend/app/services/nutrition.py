from app.models.profile import (
    SexEnum, ActivityLevelEnum, GoalTypeEnum, ACTIVITY_MULTIPLIERS
)
from dataclasses import dataclass


@dataclass
class NutritionTargets:
    bmr: float
    tdee: float
    target_calories: float
    target_protein_g: float
    target_carbs_g: float
    target_fat_g: float


# Caloric adjustments per goal type
GOAL_CALORIE_DELTA = {
    GoalTypeEnum.lose_fat: -500,      # 0.5 kg/week deficit
    GoalTypeEnum.maintain: 0,
    GoalTypeEnum.gain_muscle: 300,    # lean bulk surplus
}

# Macro distribution by goal (protein_pct, carb_pct, fat_pct)
MACRO_DISTRIBUTION = {
    GoalTypeEnum.lose_fat: (0.35, 0.35, 0.30),
    GoalTypeEnum.maintain: (0.30, 0.40, 0.30),
    GoalTypeEnum.gain_muscle: (0.30, 0.45, 0.25),
}


def calculate_bmr(weight_kg: float, height_cm: float, age: int, sex: SexEnum) -> float:
    """Mifflin-St Jeor equation."""
    if sex == SexEnum.male:
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    else:
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161


def calculate_nutrition_targets(
    weight_kg: float,
    height_cm: float,
    age: int,
    sex: SexEnum,
    activity_level: ActivityLevelEnum,
    goal_type: GoalTypeEnum,
) -> NutritionTargets:
    bmr = calculate_bmr(weight_kg, height_cm, age, sex)
    multiplier = ACTIVITY_MULTIPLIERS[activity_level]
    tdee = bmr * multiplier
    target_calories = tdee + GOAL_CALORIE_DELTA[goal_type]

    # Ensure floor for safety
    target_calories = max(target_calories, 1200 if sex == SexEnum.female else 1500)

    protein_pct, carb_pct, fat_pct = MACRO_DISTRIBUTION[goal_type]

    # 4 cal/g protein, 4 cal/g carbs, 9 cal/g fat
    target_protein_g = (target_calories * protein_pct) / 4
    target_carbs_g = (target_calories * carb_pct) / 4
    target_fat_g = (target_calories * fat_pct) / 9

    return NutritionTargets(
        bmr=round(bmr, 1),
        tdee=round(tdee, 1),
        target_calories=round(target_calories, 1),
        target_protein_g=round(target_protein_g, 1),
        target_carbs_g=round(target_carbs_g, 1),
        target_fat_g=round(target_fat_g, 1),
    )


def generate_recommendations(
    consumed_calories: float,
    consumed_protein: float,
    consumed_carbs: float,
    consumed_fat: float,
    target_calories: float,
    target_protein: float,
    target_carbs: float,
    target_fat: float,
) -> list[str]:
    """Generate smart recommendations based on current vs target macros."""
    recommendations = []

    cal_diff = target_calories - consumed_calories
    protein_diff = target_protein - consumed_protein
    carbs_diff = target_carbs - consumed_carbs
    fat_diff = target_fat - consumed_fat

    if cal_diff > 200:
        recommendations.append(f"Te faltan {cal_diff:.0f} kcal para tu objetivo de hoy.")
    elif cal_diff < -200:
        recommendations.append(f"Superaste tu objetivo calórico por {abs(cal_diff):.0f} kcal.")
    else:
        recommendations.append("¡Vas perfecto en calorías hoy!")

    if protein_diff > 20:
        recommendations.append(f"Necesitas {protein_diff:.0f}g más de proteína. Considera pollo, huevos o yogur.")
    elif protein_diff < -15:
        recommendations.append(f"Excediste proteínas en {abs(protein_diff):.0f}g.")

    if fat_diff < -10:
        recommendations.append(f"Superaste el objetivo de grasas en {abs(fat_diff):.0f}g.")

    if not recommendations:
        recommendations.append("¡Excelente equilibrio nutricional hoy!")

    return recommendations
