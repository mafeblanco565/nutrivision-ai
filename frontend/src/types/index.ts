// ============================================================
// NutriVision AI — Core TypeScript Types
// ============================================================

export type SexType = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active";
export type GoalType = "lose_fat" | "maintain" | "gain_muscle";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_premium: boolean;
  created_at: string;
  has_profile: boolean;
}

export interface Profile {
  id: number;
  user_id: number;
  full_name: string;
  age: number;
  sex: SexType;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal_type: GoalType;
  bmr: number | null;
  tdee: number | null;
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  locale: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface MealItem {
  id: number;
  meal_entry_id: number;
  food_id: number | null;
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  confidence: number | null;
  was_edited: boolean;
  deleted_at: string | null;
}

export interface MealEntry {
  id: number;
  user_id: number;
  meal_type: MealType;
  eaten_at: string;
  image_url: string | null;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  ai_confidence: number | null;
  notes: string | null;
  is_manual: boolean;
  items: MealItem[];
  created_at: string;
}

export interface DailyMacros {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  meal_count: number;
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  calories_remaining: number | null;
  protein_remaining: number | null;
}

export interface WeeklyProgress {
  days: DailyMacros[];
  avg_calories: number;
  avg_protein_g: number;
  avg_carbs_g: number;
  avg_fat_g: number;
  days_on_target: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface AIAnalysisResponse {
  meal_entry_id: number;
  detected_foods: MealItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  confidence: number;
  image_url: string | null;
}

export interface MacroRing {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
}

export interface ProfileCreate {
  full_name: string;
  age: number;
  sex: SexType;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal_type: GoalType;
}
