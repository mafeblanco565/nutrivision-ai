"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { DailyMacros } from "@/types";

interface WeeklyChartProps {
  data: DailyMacros[];
  targetCalories?: number | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-border rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-brand-600">{Math.round(payload[0].value)} kcal</p>
    </div>
  );
};

export function WeeklyChart({ data, targetCalories }: WeeklyChartProps) {
  const chartData = data.map((d) => ({
    day: format(parseISO(d.date), "EEE", { locale: es }),
    calories: Math.round(d.total_calories),
    isToday: d.date === format(new Date(), "yyyy-MM-dd"),
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} barSize={28} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          className="capitalize"
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
        {targetCalories && (
          <ReferenceLine
            y={targetCalories}
            stroke="#22c55e"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: "Meta", position: "insideTopRight", fontSize: 10, fill: "#22c55e" }}
          />
        )}
        <Bar dataKey="calories" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.isToday ? "#22c55e" : "#e2e8f0"}
              className={entry.isToday ? "" : "dark:fill-gray-700"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
