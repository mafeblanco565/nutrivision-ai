import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCalories(value: number): string {
  return Math.round(value).toLocaleString("es-ES");
}

export function formatMacro(value: number, unit = "g"): string {
  return `${Math.round(value)}${unit}`;
}

export function getMacroPercentage(consumed: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(Math.round((consumed / target) * 100), 100);
}

export function getGoalLabel(goal: string): string {
  const labels: Record<string, string> = {
    lose_fat: "Perder grasa",
    maintain: "Mantener peso",
    gain_muscle: "Ganar músculo",
  };
  return labels[goal] ?? goal;
}

export function getMealTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    breakfast: "Desayuno",
    lunch: "Almuerzo",
    dinner: "Cena",
    snack: "Snack",
  };
  return labels[type] ?? type;
}

export function getMealTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
    snack: "🍎",
  };
  return emojis[type] ?? "🍽️";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function getActivityLabel(level: string): string {
  const labels: Record<string, string> = {
    sedentary: "Sedentario",
    lightly_active: "Ligeramente activo",
    moderately_active: "Moderadamente activo",
    very_active: "Muy activo",
    extra_active: "Extra activo",
  };
  return labels[level] ?? level;
}
