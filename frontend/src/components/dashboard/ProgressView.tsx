"use client";
import { useWeeklyProgress, useTodayMacros } from "@/hooks/useMeals";
import { WeeklyChart } from "@/components/charts/WeeklyChart";
import { MacroTrendChart } from "@/components/charts/MacroTrendChart";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { TrendingUp, Target, Zap, Award } from "lucide-react";
import { formatCalories } from "@/lib/utils";

export function ProgressView() {
  const { data: weekly, isLoading } = useWeeklyProgress();
  const { data: todayMacros } = useTodayMacros();

  const stats = [
    {
      label: "Promedio kcal/día",
      value: weekly ? formatCalories(weekly.avg_calories) : "—",
      unit: "kcal",
      icon: Zap,
      color: "text-brand-600",
      bg: "bg-brand-50 dark:bg-brand-900/20",
    },
    {
      label: "Días en objetivo",
      value: weekly?.days_on_target?.toString() ?? "—",
      unit: "/ 7",
      icon: Target,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Prot. promedio",
      value: weekly ? `${Math.round(weekly.avg_protein_g)}g` : "—",
      unit: "",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Racha actual",
      value: "3",
      unit: "días",
      icon: Award,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progreso</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Últimos 7 días</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-4`}>
            <stat.icon size={18} className={`${stat.color} mb-2`} />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
              {stat.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly calorie chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="text-base font-semibold mb-4">Calorías esta semana</h2>
        {isLoading ? (
          <SkeletonCard className="h-48" />
        ) : (
          <WeeklyChart
            data={weekly?.days ?? []}
            targetCalories={todayMacros?.target_calories}
          />
        )}
      </div>

      {/* Macro trend */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="text-base font-semibold mb-4">Distribución de macros</h2>
        {isLoading ? (
          <SkeletonCard className="h-48" />
        ) : (
          <MacroTrendChart data={weekly?.days ?? []} />
        )}
      </div>
    </div>
  );
}
