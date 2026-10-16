import type { Card, Profile } from "../types";

export const PROFILES: Profile[] = [
  { profileId: "kid1", displayName: "Trainer 1", avatar: "dragon", createdAt: "2026-10-01T00:00:00Z" },
  { profileId: "kid2", displayName: "Trainer 2", avatar: "lightning", createdAt: "2026-10-01T00:00:00Z" },
];

export function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    cardId: "11111111-1111-4111-8111-111111111111",
    profileId: "kid1",
    cardNumber: 1,
    name: "Layla",
    type: "colorless",
    hp: 90,
    stage: "basic",
    evolvesFrom: null,
    evolvesFromCardId: null,
    description: "A scruffy terrier mix with a blue collar",
    flavorText: "She jumps higher than the couch.",
    attacks: [
      { name: "Jump", damage: 30, cost: ["colorless"], effect: "" },
      { name: "Play Bite", damage: 60, cost: ["colorless", "colorless"], effect: "" },
    ],
    weakness: "fighting",
    resistance: null,
    retreatCost: 1,
    artworkKey: null,
    artworkVersion: 0,
    artworkUrl: null,
    status: "complete",
    schemaVersion: 1,
    version: 1,
    createdAt: "2026-10-13T00:00:00Z",
    updatedAt: "2026-10-13T00:00:00Z",
    ...overrides,
  };
}
