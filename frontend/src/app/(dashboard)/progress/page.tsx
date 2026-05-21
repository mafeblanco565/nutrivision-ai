import type { Metadata } from "next";
import { ProgressView } from "@/components/dashboard/ProgressView";

export const metadata: Metadata = { title: "Progreso" };

export default function ProgressPage() {
  return <ProgressView />;
}
