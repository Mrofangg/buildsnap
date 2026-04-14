"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-float text-sm font-medium pointer-events-auto animate-fade-up max-w-sm w-full",
              {
                "bg-green-500 text-white": t.type === "success",
                "bg-red-500 text-white": t.type === "error",
                "bg-brand-black text-white": t.type === "info",
              }
            )}
          >
            {t.type === "success" && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
            {t.type === "error" && <XCircle className="w-4 h-4 flex-shrink-0" />}
            {t.type === "info" && <Info className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="opacity-75 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
