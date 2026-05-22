"use client";
import { useState } from "react";
import { format, parseISO, subDays, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { FoodAnalyzer } from "@/components/meals/FoodAnalyzer";
import { MealTimeline } from "@/components/meals/MealTimeline";
import { WeekStrip } from "@/components/meals/WeekStrip";
import { useMealsByDate, useTodayMeals, useMacrosByDate } from "@/hooks/useMeals";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const localToday = () => format(new Date(), "yyyy-MM-dd");

export function MealsView() {
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(localToday());

  const isToday = selectedDate === localToday();
  const todayQuery = useTodayMeals();
  const dateQuery = useMealsByDate(selectedDate);

  // Use today's endpoint when viewing today (it has client_date support), otherwise use date endpoint
  const { data: meals = [], isLoading } = isToday ? todayQuery : dateQuery;
  const { data: macros } = useMacrosByDate(selectedDate);

  const prevDay = () => setSelectedDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"));
  const nextDay = () => {
    const next = addDays(parseISO(selectedDate), 1);
    if (format(next, "yyyy-MM-dd") <= localToday()) {
      setSelectedDate(format(next, "yyyy-MM-dd"));
    }
  };

  const dateLabel = isToday
    ? "Hoy"
    : format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es });

  const handleSaved = () => {
    setShowAnalyzer(false);
    setSelectedDate(localToday());
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis comidas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registra lo que comes</p>
        </div>
        <Button onClick={() => setShowAnalyzer(true)} className="gap-2">
          <Camera size={16} />
          Analizar
        </Button>
      </div>

      {/* Analyzer panel */}
      {showAnalyzer && (
        <FoodAnalyzer onClose={() => setShowAnalyzer(false)} onSaved={handleSaved} />
      )}

      {/* Week strip */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-border">
        <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </div>

      {/* Day view */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-border">
        {/* Day navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevDay} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <h2 className="text-sm font-semibold capitalize">{dateLabel}</h2>
            {macros && macros.total_calories > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {Math.round(macros.total_calories)} kcal
                {macros.target_calories ? ` / ${Math.round(macros.target_calories)}` : ""}
              </p>
            )}
          </div>
          <button
            onClick={nextDay}
            disabled={isToday}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
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
