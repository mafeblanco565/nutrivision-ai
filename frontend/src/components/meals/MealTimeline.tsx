"use client";
import Link from "next/link";
import Image from "next/image";
import { formatCalories, getMealTypeLabel, getMealTypeEmoji } from "@/lib/utils";
import type { MealEntry } from "@/types";
import { ChevronRight } from "lucide-react";

interface MealTimelineProps {
  meals: MealEntry[];
}

export function MealTimeline({ meals }: MealTimelineProps) {
  if (meals.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-4xl mb-3">🍽️</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Sin comidas registradas</p>
        <p className="text-xs text-muted-foreground mt-1">
          Toma una foto de tu comida para empezar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => (
        <Link
          key={meal.id}
          href={`/meals/${meal.id}`}
          className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
        >
          {/* Image or emoji placeholder */}
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            {meal.image_url ? (
              <Image
                src={meal.image_url}
                alt={getMealTypeLabel(meal.meal_type)}
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {getMealTypeEmoji(meal.meal_type)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-white">
              {getMealTypeLabel(meal.meal_type)}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {meal.items.slice(0, 3).map((i) => i.food_name).join(", ")}
              {meal.items.length > 3 && ` +${meal.items.length - 3} más`}
            </p>
            <div className="flex gap-3 mt-1.5">
              <span className="text-xs font-semibold text-brand-600">
                {formatCalories(meal.total_calories)} kcal
              </span>
              <span className="text-xs text-blue-500">{Math.round(meal.total_protein_g)}g P</span>
              <span className="text-xs text-amber-500">{Math.round(meal.total_carbs_g)}g C</span>
              <span className="text-xs text-red-500">{Math.round(meal.total_fat_g)}g G</span>
            </div>
          </div>

          <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      ))}
    </div>
  );
}
