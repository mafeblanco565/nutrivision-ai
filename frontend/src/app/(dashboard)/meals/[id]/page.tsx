import type { Metadata } from "next";
import { MealDetailView } from "@/components/meals/MealDetailView";

export const metadata: Metadata = { title: "Detalle de comida" };

export default function MealDetailPage({ params }: { params: { id: string } }) {
  return <MealDetailView mealId={Number(params.id)} />;
}
