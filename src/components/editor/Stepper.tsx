interface Props {
  id?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}

/** Big −/+ buttons around a number, so small hands don't have to type. */
export function Stepper({ id, label, value, onChange, min, max, step = 10 }: Props) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="btn btn-sm w-12 text-2xl"
        aria-label={`Less ${label}`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - step))}
      >
        −
      </button>
      <input
        id={id}
        aria-label={label}
        className="input w-24 text-center font-display text-2xl"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const n = Number.parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
      />
      <button
        type="button"
        className="btn btn-sm w-12 text-2xl"
        aria-label={`More ${label}`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + step))}
      >
        +
      </button>
    </div>
  );
}
