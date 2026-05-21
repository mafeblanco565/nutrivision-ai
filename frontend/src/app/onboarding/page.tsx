import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = { title: "Configura tu perfil" };

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 flex items-center justify-center">
      <OnboardingWizard />
    </main>
  );
}
