"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

interface ConfirmProviderProps {
  children: ReactNode;
}

// Hook to detect if we're on the client
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const isMounted = useIsMounted();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    description: "",
    confirmText: "Continue",
    cancelText: "Cancel",
    variant: "default",
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions({
      title: opts.title,
      description: opts.description ?? "",
      confirmText: opts.confirmText ?? "Continue",
      cancelText: opts.cancelText ?? "Cancel",
      variant: opts.variant ?? "default",
    });
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {isMounted && isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80"
            onClick={handleCancel}
          />
          {/* Dialog */}
          <div className="relative z-50 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
            <div className="flex flex-col space-y-2 text-center sm:text-left">
              <h2 className="text-lg font-semibold">{options.title}</h2>
              {options.description && (
                <p className="text-sm text-muted-foreground">{options.description}</p>
              )}
            </div>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  display: "inline-flex",
                  height: "36px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-background)",
                  padding: "0.5rem 1rem",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {options.cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  display: "inline-flex",
                  height: "36px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: options.variant === "destructive" ? "var(--color-destructive)" : "var(--color-primary)",
                  color: options.variant === "destructive" ? "var(--color-destructive-foreground)" : "var(--color-primary-foreground)",
                  padding: "0.5rem 1rem",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
