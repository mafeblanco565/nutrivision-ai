import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-brand mb-4 shadow-lg">
            <span className="text-3xl">🥗</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">NutriVision AI</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Trackea tu nutrición con IA</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
