"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatCalories, getMacroPercentage } from "@/lib/utils";

interface CalorieRingProps {
  consumed: number;
  target: number;
}

export function CalorieRing({ consumed, target }: CalorieRingProps) {
  const percentage = getMacroPercentage(consumed, target);
  const remaining = Math.max(target - consumed, 0);
  const isOver = consumed > target;

  const data = [
    { value: Math.min(consumed, target) },
    { value: isOver ? 0 : remaining },
  ];

  return (
    <div className="relative w-48 h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={isOver ? "#ef4444" : "#22c55e"} />
            <Cell fill="#f1f5f9" className="dark:fill-gray-800" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatCalories(consumed)}
        </span>
        <span className="text-xs text-muted-foreground">kcal</span>
        <span className={`text-xs font-medium mt-1 ${isOver ? "text-red-500" : "text-brand-600"}`}>
          {isOver ? `+${formatCalories(consumed - target)}` : `${formatCalories(remaining)} restantes`}
        </span>
      </div>
    </div>
  );
}
