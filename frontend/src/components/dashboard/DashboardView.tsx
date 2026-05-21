"use client";
import { useTodayMacros, useWeeklyProgress, useRecommendations, useTodayMeals } from "@/hooks/useMeals";
import { useAuthStore } from "@/stores/auth";
import { CalorieRing } from "@/components/dashboard/CalorieRing";
import { MacroCard } from "@/components/dashboard/MacroCard";
import { WeeklyChart } from "@/components/charts/WeeklyChart";
import { MealTimeline } from "@/components/meals/MealTimeline";
import { RecommendationBanner } from "@/components/dashboard/RecommendationBanner";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { NutriVisionLogo } from "@/components/common/NutriVisionLogo";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function DashboardView() {
  const { user } = useAuthStore();
  const { data: macros, isLoading: macrosLoading } = useTodayMacros();
  const { data: weekly, isLoading: weeklyLoading } = useWeeklyProgress();
  const { data: recommendations } = useRecommendations();
  const { data: meals } = useTodayMeals();

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {/* Logo visible only on mobile (desktop shows it in sidebar) */}
          <div className="lg:hidden mb-3">
            <NutriVisionLogo size="md" />
          </div>
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
            ¡Hola! 👋
          </h1>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations?.recommendations && (
        <RecommendationBanner messages={recommendations.recommendations} />
      )}

      {/* Main calorie ring + macros */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 flex justify-center">
          {macrosLoading ? (
            <SkeletonCard className="w-48 h-48 rounded-full" />
          ) : (
            <CalorieRing
              consumed={macros?.total_calories ?? 0}
              target={macros?.target_calories ?? 2000}
            />
          )}
        </div>

        <div className="lg:col-span-3 grid grid-cols-3 gap-3">
          {macrosLoading ? (
            <>
              <SkeletonCard className="h-28" />
              <SkeletonCard className="h-28" />
              <SkeletonCard className="h-28" />
            </>
          ) : (
            <>
              <MacroCard
                label="Proteína"
                consumed={macros?.total_protein_g ?? 0}
                target={macros?.target_protein_g ?? 150}
                unit="g"
                color="nutrient-protein"
                bgColor="bg-blue-50 dark:bg-blue-900/20"
                emoji="🥩"
              />
              <MacroCard
                label="Carbos"
                consumed={macros?.total_carbs_g ?? 0}
                target={macros?.target_carbs_g ?? 200}
                unit="g"
                color="nutrient-carbs"
                bgColor="bg-amber-50 dark:bg-amber-900/20"
                emoji="🍞"
              />
              <MacroCard
                label="Grasas"
                consumed={macros?.total_fat_g ?? 0}
                target={macros?.target_fat_g ?? 65}
                unit="g"
                color="nutrient-fat"
                bgColor="bg-red-50 dark:bg-red-900/20"
                emoji="🥑"
              />
            </>
          )}
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="text-base font-semibold mb-4">Progreso semanal</h2>
        {weeklyLoading ? (
          <SkeletonCard className="h-48" />
        ) : (
          <WeeklyChart data={weekly?.days ?? []} targetCalories={macros?.target_calories} />
        )}
      </div>

      {/* Meal timeline */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Comidas de hoy</h2>
          <span className="text-sm text-muted-foreground">{meals?.length ?? 0} registradas</span>
        </div>
        <MealTimeline meals={meals ?? []} />
      </div>
    </div>
  );
}
