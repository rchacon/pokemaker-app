import { ENERGY } from "../../lib/energy";
import { ENERGY_TYPES, type EnergyType } from "../../types";
import { EnergyIcon } from "../EnergyIcon";

interface Props {
  label: string;
  value: EnergyType | null;
  onChange: (value: EnergyType | null) => void;
  allowNone?: boolean;
  compact?: boolean;
}

/** A grid of big type buttons (a radio group, so it works with keyboards and screen readers). */
export function TypePicker({ label, value, onChange, allowNone = false, compact = false }: Props) {
  const size = compact ? "1.75rem" : "2.25rem";
  return (
    <div role="radiogroup" aria-label={label} className={`grid gap-2 ${compact ? "grid-cols-6 sm:grid-cols-11" : "grid-cols-5"}`}>
      {allowNone && (
        <Choice selected={value === null} onSelect={() => onChange(null)} label="None" compact={compact}>
          <span className="grid place-items-center rounded-full border-2 border-dashed border-ink-soft font-bold" style={{ width: size, height: size }}>
            –
          </span>
        </Choice>
      )}
      {ENERGY_TYPES.map((type) => (
        <Choice key={type} selected={value === type} onSelect={() => onChange(type)} label={ENERGY[type].label} compact={compact}>
          <EnergyIcon type={type} size={size} title="" />
        </Choice>
      ))}
    </div>
  );
}

function Choice({ selected, onSelect, label, compact, children }: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  compact: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      className={`flex flex-col items-center gap-1 rounded-2xl border-3 p-1.5 transition ${
        selected ? "scale-105 border-ink bg-sun shadow-[0_3px_0_var(--color-ink)]" : "border-transparent bg-slate-100 hover:bg-slate-200"
      }`}
    >
      {children}
      {!compact && <span className="text-xs font-extrabold">{label}</span>}
    </button>
  );
}
