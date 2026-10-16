import { changeType } from "../../lib/cardDefaults";
import { STAGE_LABELS } from "../../lib/energy";
import { LIMITS, STAGES, type Attack, type Card, type CardFields } from "../../types";
import { Field, Panel } from "../ui";
import { AttackEditor } from "./AttackEditor";
import { Stepper } from "./Stepper";
import { TypePicker } from "./TypePicker";

interface Props {
  fields: CardFields;
  onChange: (update: (previous: CardFields) => CardFields) => void;
  /** The child's other cards, offered as "evolves from" choices. */
  otherCards: Card[];
  /** Slot for the artwork controls, shown in the "Looks" section. */
  artworkControls?: React.ReactNode;
}

export function CardForm({ fields, onChange, otherCards, artworkControls }: Props) {
  const set = <K extends keyof CardFields>(key: K, value: CardFields[K]) =>
    onChange((previous) => ({ ...previous, [key]: value }));

  const setAttack = (index: number, attack: Attack) =>
    onChange((previous) => ({ ...previous, attacks: previous.attacks.map((a, i) => (i === index ? attack : a)) }));

  const evolveChoices = otherCards.filter((c) => c.name.trim() && c.name !== fields.name);

  return (
    <div className="flex flex-col gap-5">
      <Panel title="Name & type" emoji="✨">
        <Field label="Creature name" htmlFor="card-name" count={fields.name.length} max={LIMITS.name}>
          <input
            id="card-name"
            className="input font-display text-2xl"
            maxLength={LIMITS.name}
            placeholder="Flamepup"
            autoComplete="off"
            value={fields.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Type">
          <TypePicker
            label="Type"
            value={fields.type}
            onChange={(type) => type && onChange((previous) => changeType(previous, type))}
          />
        </Field>
      </Panel>

      <Panel title="Power" emoji="💪">
        <Field label="HP (hit points)" htmlFor="card-hp">
          <Stepper id="card-hp" label="HP" value={fields.hp} min={LIMITS.hpMin} max={LIMITS.hpMax} onChange={(hp) => set("hp", hp)} />
        </Field>
        <Field label="Evolution stage">
          <div role="radiogroup" aria-label="Evolution stage" className="flex flex-wrap gap-2">
            {STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                role="radio"
                aria-checked={fields.stage === stage}
                className={`btn btn-sm ${fields.stage === stage ? "btn-primary" : ""}`}
                onClick={() =>
                  onChange((previous) => ({
                    ...previous,
                    stage,
                    ...(stage === "basic" ? { evolvesFrom: null, evolvesFromCardId: null } : {}),
                  }))
                }
              >
                {STAGE_LABELS[stage]}
              </button>
            ))}
          </div>
        </Field>
        {fields.stage !== "basic" && (
          <Field label="Evolves from" htmlFor="card-evolves" hint="Pick one of your cards or type a name.">
            <input
              id="card-evolves"
              className="input"
              list="evolve-choices"
              maxLength={LIMITS.name}
              placeholder="Flamepup"
              value={fields.evolvesFrom ?? ""}
              onChange={(e) => {
                const name = e.target.value;
                const match = evolveChoices.find((c) => c.name === name);
                onChange((previous) => ({
                  ...previous,
                  evolvesFrom: name || null,
                  evolvesFromCardId: match?.cardId ?? null,
                }));
              }}
            />
            <datalist id="evolve-choices">
              {evolveChoices.map((c) => (
                <option key={c.cardId} value={c.name} />
              ))}
            </datalist>
          </Field>
        )}
      </Panel>

      <Panel title="Looks" emoji="🎨">
        <Field
          label="What does your creature look like?"
          htmlFor="card-description"
          count={fields.description.length}
          max={LIMITS.description}
          hint="Colors, shape, size, eyes, tail, wings… The more you describe, the better the art!"
        >
          <textarea
            id="card-description"
            className="input"
            rows={4}
            maxLength={LIMITS.description}
            placeholder="A tiny orange fox with a flaming tail, big green eyes and fluffy ears"
            value={fields.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        {artworkControls}
        <Field label="Card story (optional)" htmlFor="card-flavor" count={fields.flavorText.length} max={LIMITS.flavorText}>
          <textarea
            id="card-flavor"
            className="input"
            rows={2}
            maxLength={LIMITS.flavorText}
            placeholder="It loves to nap in warm sunbeams."
            value={fields.flavorText}
            onChange={(e) => set("flavorText", e.target.value)}
          />
        </Field>
      </Panel>

      <Panel title="Attacks" emoji="⚔️">
        {fields.attacks.map((attack, index) => (
          <AttackEditor
            key={index}
            index={index}
            attack={attack}
            onChange={(a) => setAttack(index, a)}
            onRemove={() => onChange((previous) => ({ ...previous, attacks: previous.attacks.filter((_, i) => i !== index) }))}
          />
        ))}
        {fields.attacks.length < LIMITS.attacks && (
          <button
            type="button"
            className="btn btn-go"
            onClick={() =>
              onChange((previous) => ({
                ...previous,
                attacks: [...previous.attacks, { name: "", damage: 30, cost: [previous.type], effect: "" }],
              }))
            }
          >
            ➕ Add an attack
          </button>
        )}
      </Panel>

      <Panel title="Weakness, resistance & retreat" emoji="🛡️">
        <Field label="Weakness" hint="Attacks of this type do double damage.">
          <TypePicker label="Weakness" compact allowNone value={fields.weakness} onChange={(v) => set("weakness", v)} />
        </Field>
        <Field label="Resistance" hint="Attacks of this type do 30 less damage.">
          <TypePicker label="Resistance" compact allowNone value={fields.resistance} onChange={(v) => set("resistance", v)} />
        </Field>
        <Field label="Retreat cost" htmlFor="card-retreat">
          <Stepper
            id="card-retreat"
            label="Retreat cost"
            value={fields.retreatCost}
            step={1}
            min={0}
            max={LIMITS.retreatMax}
            onChange={(n) => set("retreatCost", n)}
          />
        </Field>
      </Panel>
    </div>
  );
}
