"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mealService } from "@/services/meal.service";

export const MEAL_KEYS = {
  all: ["meals"] as const,
  today: ["meals", "today"] as const,
  byDate: (date: string) => ["meals", "date", date] as const,
  detail: (id: number) => ["meals", id] as const,
  todayMacros: ["macros", "today"] as const,
  macrosByDate: (date: string) => ["macros", "date", date] as const,
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

export function useMacrosByDate(dateStr: string) {
  return useQuery({
    queryKey: MEAL_KEYS.macrosByDate(dateStr),
    queryFn: () => mealService.getMacrosByDate(dateStr),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAnalyzeOnly() {
  return useMutation({
    mutationFn: (file: File) => mealService.analyzeImageOnly(file),
  });
}

export function useSaveMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mealService.saveMeal,
    onSuccess: (savedMeal) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: MEAL_KEYS.today });
        queryClient.invalidateQueries({ queryKey: MEAL_KEYS.todayMacros });
        queryClient.invalidateQueries({ queryKey: MEAL_KEYS.byDate(savedMeal.eaten_at) });
        queryClient.invalidateQueries({ queryKey: MEAL_KEYS.macrosByDate(savedMeal.eaten_at) });
        queryClient.invalidateQueries({ queryKey: MEAL_KEYS.recommendations });
        queryClient.invalidateQueries({ queryKey: ["macros", "weekly"] });
      }, 400);
    },
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
      queryClient.invalidateQueries({ queryKey: ["macros", "weekly"] });
    },
  });
}

export function useLookupFood() {
  return useMutation({
    mutationFn: ({ foodName, quantityG }: { foodName: string; quantityG: number }) =>
      mealService.lookupFood(foodName, quantityG),
  });
}

export function useDeleteMealItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mealId, itemId }: { mealId: number; itemId: number }) =>
      mealService.deleteMealItem(mealId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_KEYS.today });
      queryClient.invalidateQueries({ queryKey: MEAL_KEYS.todayMacros });
    },
  });
}
