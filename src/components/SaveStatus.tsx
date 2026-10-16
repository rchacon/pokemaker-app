import type { SaveState } from "../hooks/useCardEditor";

const LABELS: Record<SaveState, { text: string; className: string }> = {
  loading: { text: "Loading…", className: "bg-slate-100" },
  new: { text: "Not saved yet", className: "bg-sun/40" },
  saved: { text: "✓ Saved", className: "bg-leaf/25" },
  dirty: { text: "Saving soon…", className: "bg-slate-100" },
  saving: { text: "Saving…", className: "bg-slate-100" },
  offline: { text: "Saved on this device · retrying", className: "bg-sun/40" },
  conflict: { text: "Needs a choice", className: "bg-berry/25" },
  error: { text: "Couldn't save", className: "bg-berry/25" },
  missing: { text: "Card not found", className: "bg-berry/25" },
};

export function SaveStatus({ state }: { state: SaveState }) {
  const { text, className } = LABELS[state];
  return (
    <span role="status" aria-live="polite" className={`rounded-full px-3 py-1 text-sm font-extrabold whitespace-nowrap ${className}`}>
      {text}
    </span>
  );
}
