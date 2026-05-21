import type { Metadata } from "next";
import { MealDetailView } from "@/components/meals/MealDetailView";

export const metadata: Metadata = { title: "Detalle de comida" };

export default async function MealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MealDetailView mealId={Number(id)} />;
}
