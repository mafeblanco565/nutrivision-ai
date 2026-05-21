"use client";
import { useState } from "react";
import { FoodAnalyzer } from "@/components/meals/FoodAnalyzer";
import { MealTimeline } from "@/components/meals/MealTimeline";
import { useTodayMeals } from "@/hooks/useMeals";
import { Camera, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MealsView() {
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const { data: meals = [], isLoading } = useTodayMeals();

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis comidas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registra lo que comes hoy</p>
        </div>
        <Button onClick={() => setShowAnalyzer(true)} className="gap-2">
          <Camera size={16} />
          Analizar comida
        </Button>
      </div>

      {showAnalyzer && (
        <FoodAnalyzer onClose={() => setShowAnalyzer(false)} />
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="text-base font-semibold mb-4">Hoy</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 rounded-xl skeleton" />
            ))}
          </div>
        ) : (
          <MealTimeline meals={meals} />
        )}
      </div>
    </div>
  );
}
