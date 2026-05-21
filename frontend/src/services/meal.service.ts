import apiClient from "@/lib/api";
import type { MealEntry, AIAnalysisResponse, DailyMacros, WeeklyProgress } from "@/types";

export const mealService = {
  async analyzeImage(
    imageFile: File,
    mealType: string,
    eatenAt: string
  ): Promise<AIAnalysisResponse> {
    const form = new FormData();
    form.append("image", imageFile);
    form.append("meal_type", mealType);
    form.append("eaten_at", eatenAt);

    const { data } = await apiClient.post<AIAnalysisResponse>("/meals/analyze", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async getTodayMeals(): Promise<MealEntry[]> {
    const { data } = await apiClient.get<MealEntry[]>("/meals/today");
    return data;
  },

  async getMealsByDate(date: string): Promise<MealEntry[]> {
    const { data } = await apiClient.get<MealEntry[]>(`/meals/date/${date}`);
    return data;
  },

  async getMeal(id: number): Promise<MealEntry> {
    const { data } = await apiClient.get<MealEntry>(`/meals/${id}`);
    return data;
  },

  async updateMealItem(
    mealId: number,
    itemId: number,
    payload: { food_name?: string; quantity_g?: number }
  ): Promise<MealEntry> {
    const { data } = await apiClient.patch<MealEntry>(
      `/meals/${mealId}/items/${itemId}`,
      payload
    );
    return data;
  },

  async deleteMealItem(mealId: number, itemId: number): Promise<MealEntry> {
    const { data } = await apiClient.delete<MealEntry>(`/meals/${mealId}/items/${itemId}`);
    return data;
  },

  async deleteMeal(id: number): Promise<void> {
    await apiClient.delete(`/meals/${id}`);
  },

  async getTodayMacros(): Promise<DailyMacros> {
    const { data } = await apiClient.get<DailyMacros>("/macros/today");
    return data;
  },

  async getWeeklyProgress(endDate?: string): Promise<WeeklyProgress> {
    const params = endDate ? { end_date: endDate } : {};
    const { data } = await apiClient.get<WeeklyProgress>("/macros/weekly", { params });
    return data;
  },

  async getRecommendations(): Promise<{ recommendations: string[] }> {
    const { data } = await apiClient.get("/macros/recommendations");
    return data;
  },
};
