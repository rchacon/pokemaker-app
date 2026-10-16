import { ENERGY } from "../../lib/energy";
import { ENERGY_TYPES, LIMITS, type EnergyType } from "../../types";
import { EnergyIcon } from "../EnergyIcon";

interface Props {
  value: EnergyType[];
  onChange: (cost: EnergyType[]) => void;
  attackLabel: string;
}

/** Tap a type to add it to the cost; tap a chosen icon to remove it. */
export function EnergyCostPicker({ value, onChange, attackLabel }: Props) {
  const full = value.length >= LIMITS.cost;
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 px-2 py-1.5"
        aria-label={`${attackLabel} energy cost`}
        data-testid="energy-cost"
      >
        {value.length === 0 && <span className="px-1 text-sm font-bold text-ink-soft">Free! Tap below to add energy</span>}
        {value.map((type, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Remove ${ENERGY[type].label} energy`}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            className="rounded-full transition hover:scale-110"
          >
            <EnergyIcon type={type} size="2.25rem" title="" />
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ENERGY_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            disabled={full}
            aria-label={`Add ${ENERGY[type].label} energy`}
            onClick={() => onChange([...value, type])}
            className="rounded-full p-0.5 transition enabled:hover:scale-110 disabled:opacity-30"
          >
            <EnergyIcon type={type} size="1.9rem" title="" />
          </button>
        ))}
      </div>
    </div>
  );
}
