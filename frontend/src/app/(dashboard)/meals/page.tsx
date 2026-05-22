import { Suspense } from "react";
import type { Metadata } from "next";
import { MealsView } from "@/components/meals/MealsView";

export const metadata: Metadata = { title: "Mis comidas" };

export default function MealsPage() {
  return (
    <Suspense>
      <MealsView />
    </Suspense>
  );
}
