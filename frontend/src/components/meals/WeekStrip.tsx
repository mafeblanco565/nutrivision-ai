"use client";
import { format, subDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useWeeklyProgress } from "@/hooks/useMeals";

interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function WeekStrip({ selectedDate, onSelectDate }: WeekStripProps) {
  // Generate last 7 days ending today
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    return format(d, "yyyy-MM-dd");
  });

  const { data: weekly } = useWeeklyProgress();
  const calsByDate: Record<string, number> = {};
  if (weekly) {
    weekly.days.forEach((d) => { calsByDate[d.date] = d.total_calories; });
  }

  const maxCals = Math.max(...Object.values(calsByDate), 1);
  const target = weekly?.days[0]?.target_calories ?? 2000;

  return (
    <div className="flex gap-1 items-end">
      {days.map((dateStr) => {
        const cals = calsByDate[dateStr] ?? 0;
        const barHeight = Math.max((cals / maxCals) * 40, cals > 0 ? 4 : 1);
        const isSelected = dateStr === selectedDate;
        const isTodayDate = dateStr === format(today, "yyyy-MM-dd");
        const onTarget = target > 0 && cals >= target * 0.8 && cals <= target * 1.2;
        const dayLabel = format(parseISO(dateStr), "EEE", { locale: es }).slice(0, 2);

        return (
          <button
            key={dateStr}
            onClick={() => onSelectDate(dateStr)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
              isSelected
                ? "bg-primary/10 ring-2 ring-primary/40"
                : "hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {/* Bar */}
            <div className="w-full flex justify-center">
              <div
                className={`w-5 rounded-t-sm transition-all ${
                  cals === 0 ? "bg-gray-200 dark:bg-gray-700"
                  : onTarget ? "bg-green-400"
                  : "bg-brand-400"
                }`}
                style={{ height: `${barHeight}px` }}
              />
            </div>

            {/* Day label */}
            <p className={`text-[10px] font-medium capitalize ${
              isSelected ? "text-primary" : isTodayDate ? "text-brand-600" : "text-muted-foreground"
            }`}>
              {dayLabel}
            </p>

            {/* Calories */}
            {cals > 0 && (
              <p className="text-[9px] text-muted-foreground leading-none">{Math.round(cals)}</p>
            )}

            {/* Today dot */}
            {isTodayDate && (
              <div className="w-1 h-1 rounded-full bg-brand-500 mx-auto" />
            )}
          </button>
        );
      })}
    </div>
  );
}
