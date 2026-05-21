"use client";
import { formatMacro, getMacroPercentage } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface MacroCardProps {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
  bgColor: string;
  emoji: string;
}

const PROGRESS_COLORS: Record<string, string> = {
  "nutrient-protein": "[&>div]:bg-blue-500",
  "nutrient-carbs": "[&>div]:bg-amber-500",
  "nutrient-fat": "[&>div]:bg-red-500",
};

export function MacroCard({ label, consumed, target, unit, color, bgColor, emoji }: MacroCardProps) {
  const pct = getMacroPercentage(consumed, target);
  const isOver = consumed > target;

  return (
    <div className={`rounded-2xl p-4 ${bgColor} transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl">{emoji}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          isOver ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                 : "bg-white/80 dark:bg-gray-800/80 text-muted-foreground"
        }`}>
          {pct}%
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {formatMacro(consumed, unit)}
        </p>
        <p className="text-xs text-muted-foreground">de {formatMacro(target, unit)}</p>
      </div>
      <Progress
        value={pct}
        className={`mt-3 h-1.5 ${PROGRESS_COLORS[color] ?? ""}`}
      />
    </div>
  );
}
