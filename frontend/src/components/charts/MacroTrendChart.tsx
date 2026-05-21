"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { DailyMacros } from "@/types";

interface MacroTrendChartProps {
  data: DailyMacros[];
}

export function MacroTrendChart({ data }: MacroTrendChartProps) {
  const chartData = data.map((d) => ({
    day: format(parseISO(d.date), "EEE", { locale: es }),
    Proteína: Math.round(d.total_protein_g),
    Carbos: Math.round(d.total_carbs_g),
    Grasa: Math.round(d.total_fat_g),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCarbs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            fontSize: "12px",
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
        <Area type="monotone" dataKey="Proteína" stroke="#3b82f6" fill="url(#colorProtein)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="Carbos" stroke="#f59e0b" fill="url(#colorCarbs)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="Grasa" stroke="#ef4444" fill="url(#colorFat)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
