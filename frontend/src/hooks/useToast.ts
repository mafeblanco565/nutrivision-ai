"use client";
import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

let globalToasts: Toast[] = [];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export function toast(props: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  globalToasts = [...globalToasts, { ...props, id }];
  notify();
  setTimeout(() => {
    globalToasts = globalToasts.filter((t) => t.id !== id);
    notify();
  }, 4000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(globalToasts);

  const refresh = useCallback(() => setToasts([...globalToasts]), []);
  if (!listeners.includes(refresh)) listeners.push(refresh);

  const dismiss = useCallback((id: string) => {
    globalToasts = globalToasts.filter((t) => t.id !== id);
    notify();
  }, []);

  return { toasts, dismiss };
}
