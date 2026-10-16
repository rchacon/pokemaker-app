import type { Card, CardFields, EnergyType } from "../types";
import { SUGGESTED_WEAKNESS } from "./energy";

export function newCardFields(type: EnergyType = "fire"): CardFields {
  return {
    name: "",
    type,
    hp: 60,
    stage: "basic",
    evolvesFrom: null,
    evolvesFromCardId: null,
    description: "",
    flavorText: "",
    attacks: [{ name: "", damage: 20, cost: [type], effect: "" }],
    weakness: SUGGESTED_WEAKNESS[type],
    resistance: null,
    retreatCost: 1,
  };
}

/** Strip server-only attributes so a saved card can be edited (and compared) as fields. */
export function toFields(card: Card | CardFields): CardFields {
  return {
    name: card.name,
    type: card.type,
    hp: card.hp,
    stage: card.stage,
    evolvesFrom: card.evolvesFrom ?? null,
    evolvesFromCardId: card.evolvesFromCardId ?? null,
    description: card.description,
    flavorText: card.flavorText,
    attacks: card.attacks.map((a) => ({ name: a.name, damage: a.damage, cost: [...a.cost], effect: a.effect })),
    weakness: card.weakness ?? null,
    resistance: card.resistance ?? null,
    retreatCost: card.retreatCost,
  };
}

export function sameFields(a: CardFields, b: CardFields): boolean {
  return JSON.stringify(toFields(a)) === JSON.stringify(toFields(b));
}

/**
 * Changing a card's type also updates choices that were still on their
 * type-based defaults (weakness, single-type attack costs), so kids don't have
 * to fix them by hand. Anything they picked themselves is left alone.
 */
export function changeType(fields: CardFields, type: EnergyType): CardFields {
  const old = fields.type;
  const weaknessWasDefault = fields.weakness === null || fields.weakness === SUGGESTED_WEAKNESS[old];
  return {
    ...fields,
    type,
    weakness: weaknessWasDefault ? SUGGESTED_WEAKNESS[type] : fields.weakness,
    attacks: fields.attacks.map((attack) =>
      attack.cost.length > 0 && attack.cost.every((c) => c === old)
        ? { ...attack, cost: attack.cost.map(() => type) }
        : attack,
    ),
  };
}
