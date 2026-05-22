"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatCalories, getMealTypeLabel, getMealTypeEmoji } from "@/lib/utils";
import { useDeleteMeal } from "@/hooks/useMeals";
import type { MealEntry } from "@/types";
import { ChevronRight, Trash2, Loader2 } from "lucide-react";

interface MealTimelineProps {
  meals: MealEntry[];
}

export function MealTimeline({ meals }: MealTimelineProps) {
  const deleteMeal = useDeleteMeal();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  if (meals.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-4xl mb-3">🍽️</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Sin comidas registradas</p>
        <p className="text-xs text-muted-foreground mt-1">
          Usa el botón "Agregar" para registrar una comida
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {meals.map((meal) => (
        <div key={meal.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
          {/* Image or emoji */}
          <Link href={`/meals/${meal.id}`} className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            {meal.image_url ? (
              <Image
                src={meal.image_url}
                alt={getMealTypeLabel(meal.meal_type)}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">
                {getMealTypeEmoji(meal.meal_type)}
              </div>
            )}
          </Link>

          {/* Info */}
          <Link href={`/meals/${meal.id}`} className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-white">
              {getMealTypeLabel(meal.meal_type)}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {meal.items.filter(i => !i.deleted_at).slice(0, 3).map((i) => i.food_name).join(", ")}
              {meal.items.filter(i => !i.deleted_at).length > 3 && ` +${meal.items.filter(i => !i.deleted_at).length - 3} más`}
            </p>
            <div className="flex gap-3 mt-1">
              <span className="text-xs font-semibold text-brand-600">
                {formatCalories(meal.total_calories)} kcal
              </span>
              <span className="text-xs text-blue-500">{Math.round(meal.total_protein_g)}g P</span>
              <span className="text-xs text-amber-500">{Math.round(meal.total_carbs_g)}g C</span>
              <span className="text-xs text-red-500">{Math.round(meal.total_fat_g)}g G</span>
            </div>
          </Link>

          {/* Delete */}
          {confirmId === meal.id ? (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => {
                  deleteMeal.mutate(meal.id);
                  setConfirmId(null);
                }}
                disabled={deleteMeal.isPending}
                className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                {deleteMeal.isPending ? <Loader2 size={12} className="animate-spin" /> : "Eliminar"}
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="text-xs px-2 py-1 rounded-lg border border-border hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmId(meal.id)}
              className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-all shrink-0"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
