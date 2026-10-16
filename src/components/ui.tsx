import { useEffect, useRef, type ReactNode } from "react";

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="panel w-full max-w-sm p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-display text-2xl font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-lg font-semibold text-ink-soft">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button ref={cancelRef} className="btn" onClick={onCancel}>
            Keep it
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error"; children: ReactNode }) {
  const colors = {
    info: "bg-sky/20 border-sky-dark",
    warn: "bg-sun/30 border-sun-dark",
    error: "bg-berry/15 border-berry-dark",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border-3 px-4 py-3 font-semibold ${colors}`}>
      {children}
    </div>
  );
}
