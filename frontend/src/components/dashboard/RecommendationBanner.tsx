"use client";
import { Lightbulb } from "lucide-react";

export function RecommendationBanner({ messages }: { messages: string[] }) {
  if (!messages.length) return null;

  return (
    <div className="bg-gradient-to-r from-brand-500/10 to-blue-500/10 border border-brand-200 dark:border-brand-800 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lightbulb size={14} className="text-white" />
        </div>
        <div className="space-y-1">
          {messages.map((msg, i) => (
            <p key={i} className="text-sm text-gray-700 dark:text-gray-300">
              {msg}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
