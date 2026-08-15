"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: "default" | "error";
}

interface ToastContextValue {
  push: (toast: Omit<Toast, "id">) => void;
}

// Exported so callers that may render outside a ToastProvider (e.g. a Page Builder block's Render,
// which also mounts inside the admin canvas under a different layout tree) can read it directly via
// useContext and treat "no provider" as null instead of hitting useToast()'s throw.
export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { ...toast, id }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pe-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto w-full max-w-sm rounded-[var(--radius-md)] border px-4 py-3 shadow-[var(--shadow-lifted)]",
              toast.tone === "error" ? "border-signal/30 bg-signal-soft text-signal" : "border-ink/10 bg-ink text-paper"
            )}
          >
            <p className="text-sm font-medium">{toast.title}</p>
            {toast.description ? <p className="mt-0.5 text-sm opacity-80">{toast.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
