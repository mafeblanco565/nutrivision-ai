"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mealService } from "@/services/meal.service";
import { format } from "date-fns";

export const MEAL_KEYS = {
  all: ["meals"] as const,
  today: ["meals", "today"] as const,
  byDate: (date: string) => ["meals", "date", date] as const,
  detail: (id: number) => ["meals", id] as const,
  todayMacros: ["macros", "today"] as const,
  weekly: (end?: string) => ["macros", "weekly", end] as const,
  recommendations: ["macros", "recommendations"] as const,
};

export function useTodayMeals() {
  return useQuery({
    queryKey: MEAL_KEYS.today,
    queryFn: mealService.getTodayMeals,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMealsByDate(date: string) {
  return useQuery({
    queryKey: MEAL_KEYS.byDate(date),
    queryFn: () => mealService.getMealsByDate(date),
  });
}

export function useTodayMacros() {
  return useQuery({
    queryKey: MEAL_KEYS.todayMacros,
    queryFn: mealService.getTodayMacros,
    refetchInterval: 30 * 1000,
  });
}

export function useWeeklyProgress(endDate?: string) {
  return useQuery({
    queryKey: MEAL_KEYS.weekly(endDate),
    queryFn: () => mealService.getWeeklyProgress(endDate),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: MEAL_KEYS.recommendations,
    queryFn: mealService.getRecommendations,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyzeMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      mealType,
      date,
    }: {
      file: File;
      mealType: string;
      date: string;
    }) => mealService.analyzeImage(file, mealType, date),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: MEAL_KEYS.today });
        queryClient.invalidateQueries({ queryKey: MEAL_KEYS.todayMacros });
        queryClient.invalidateQueries({ queryKey: MEAL_KEYS.recommendations });
      }, 800);
    },
  });
}

export function useUpdateMealItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mealId,
      itemId,
      payload,
    }: {
      mealId: number;
      itemId: number;
      payload: { food_name?: string; quantity_g?: number };
    }) => mealService.updateMealItem(mealId, itemId, payload),
    onSuccess: (updatedMeal) => {
      queryClient.invalidateQueries({ queryKey: MEAL_KEYS.today });
      queryClient.invalidateQueries({ queryKey: MEAL_KEYS.todayMacros });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mealService.deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_KEYS.today });
      queryClient.invalidateQueries({ queryKey: MEAL_KEYS.todayMacros });
    },
  });
}
