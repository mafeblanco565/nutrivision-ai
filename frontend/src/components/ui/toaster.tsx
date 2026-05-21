"use client";
import { useToast } from "@/hooks/useToast";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-2xl shadow-lg border text-sm animate-slide-up ${
            toast.variant === "destructive"
              ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200"
              : "bg-white border-border text-gray-900 dark:bg-gray-900 dark:text-white"
          }`}
        >
          <div className="flex-1">
            {toast.title && <p className="font-medium">{toast.title}</p>}
            {toast.description && <p className="text-xs opacity-80 mt-0.5">{toast.description}</p>}
          </div>
          <button onClick={() => dismiss(toast.id)} className="opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
