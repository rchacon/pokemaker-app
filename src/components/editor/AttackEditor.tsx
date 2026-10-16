import { LIMITS, type Attack } from "../../types";
import { Field } from "../ui";
import { EnergyCostPicker } from "./EnergyCostPicker";
import { Stepper } from "./Stepper";

interface Props {
  index: number;
  attack: Attack;
  onChange: (attack: Attack) => void;
  onRemove: () => void;
}

export function AttackEditor({ index, attack, onChange, onRemove }: Props) {
  const label = `Attack ${index + 1}`;
  const id = `attack-${index}`;
  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl border-3 border-dashed border-slate-300 p-3" aria-label={label}>
      <div className="flex items-center justify-between">
        <legend className="font-display text-xl font-semibold">{label}</legend>
        <button type="button" className="btn btn-sm" onClick={onRemove} aria-label={`Remove ${label}`}>
          🗑️ Remove
        </button>
      </div>
      <Field label="Attack name" htmlFor={`${id}-name`} count={attack.name.length} max={LIMITS.attackName}>
        <input
          id={`${id}-name`}
          className="input"
          maxLength={LIMITS.attackName}
          placeholder="Super Splash"
          value={attack.name}
          onChange={(e) => onChange({ ...attack, name: e.target.value })}
        />
      </Field>
      <Field label="Damage" htmlFor={`${id}-damage`}>
        <Stepper
          id={`${id}-damage`}
          label={`${label} damage`}
          value={attack.damage}
          min={0}
          max={LIMITS.damageMax}
          onChange={(damage) => onChange({ ...attack, damage })}
        />
      </Field>
      <Field label="Energy cost">
        <EnergyCostPicker value={attack.cost} attackLabel={label} onChange={(cost) => onChange({ ...attack, cost })} />
      </Field>
      <Field label="What it does (optional)" htmlFor={`${id}-effect`} count={attack.effect.length} max={LIMITS.effect}>
        <textarea
          id={`${id}-effect`}
          className="input"
          rows={2}
          maxLength={LIMITS.effect}
          placeholder="Flip a coin. If heads, the other creature falls asleep."
          value={attack.effect}
          onChange={(e) => onChange({ ...attack, effect: e.target.value })}
        />
      </Field>
    </fieldset>
  );
}
