import { useEffect, useId, useRef, type ReactNode } from "react";

export function Panel({ title, emoji, children, className = "" }: {
  title: string;
  emoji: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section className={`panel p-4 sm:p-5 ${className}`} aria-labelledby={id}>
      <h2 id={id} className="mb-3 flex items-center gap-2 font-display text-2xl font-semibold">
        <span aria-hidden>{emoji}</span>
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function Field({ label, htmlFor, hint, count, max, children }: {
  label: string;
  htmlFor?: string;
  hint?: string;
  count?: number;
  max?: number;
  children: ReactNode;
}) {
  const nearLimit = count !== undefined && max !== undefined && count > max * 0.85;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="font-display text-lg font-semibold">
          {label}
        </label>
        {count !== undefined && max !== undefined && (
          <span className={`text-sm font-bold ${nearLimit ? "text-berry-dark" : "text-ink-soft"}`}>
            {count}/{max}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="text-sm font-semibold text-ink-soft">{hint}</p>}
    </div>
  );
}

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
