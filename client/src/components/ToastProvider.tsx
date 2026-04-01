import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastKind = "success" | "warn" | "error";

type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  success: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

const TOAST_TIMEOUT_MS = 3500;

const ToastContext = createContext<ToastContextValue | null>(null);

const createToastId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (kind: ToastKind, message: string) => {
      const normalizedMessage = message.trim();
      if (!normalizedMessage) {
        return;
      }

      const id = createToastId();
      setToasts((prev) => [...prev, { id, kind, message: normalizedMessage }]);

      window.setTimeout(() => {
        removeToast(id);
      }, TOAST_TIMEOUT_MS);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message) => addToast("success", message),
      warn: (message) => addToast("warn", message),
      error: (message) => addToast("error", message),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-${toast.kind}`}>
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-dismiss"
              aria-label="Dismiss alert"
              onClick={() => removeToast(toast.id)}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
