import { useState, useCallback } from "react";

type ToastType = "default" | "destructive";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastType;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastType;
}

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = (++toastCount).toString();
    const newToast: Toast = {
      id,
      ...options,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);

    // For now, just log to console since we don't have a toast UI component
    console.log(`Toast: ${options.title}`, options.description);
  }, []);

  const dismiss = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}