// Shapes shared with pokemaker-api (camelCase JSON). Keep in sync with src/models/*.py there.

export const ENERGY_TYPES = [
  "grass",
  "fire",
  "water",
  "lightning",
  "psychic",
  "fighting",
  "darkness",
  "metal",
  "dragon",
  "colorless",
] as const;

export type EnergyType = (typeof ENERGY_TYPES)[number];

export const STAGES = ["basic", "stage1", "stage2"] as const;
export type Stage = (typeof STAGES)[number];

export interface Attack {
  name: string;
  damage: number;
  cost: EnergyType[];
  effect: string;
}

/** Everything a child can edit. The live preview renders from exactly this. */
export interface CardFields {
  name: string;
  type: EnergyType;
  hp: number;
  stage: Stage;
  evolvesFrom: string | null;
  evolvesFromCardId: string | null;
  description: string;
  flavorText: string;
  attacks: Attack[];
  weakness: EnergyType | null;
  resistance: EnergyType | null;
  retreatCost: number;
}

export interface Card extends CardFields {
  cardId: string;
  profileId: string;
  cardNumber: number;
  artworkKey: string | null;
  artworkVersion: number;
  artworkUrl: string | null;
  status: "draft" | "complete";
  schemaVersion: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** What the card renderer needs: the editable fields plus optional saved extras. */
export type CardView = CardFields & {
  cardNumber?: number | null;
  artworkUrl?: string | null;
};

export interface Profile {
  profileId: string;
  displayName: string;
  avatar: string;
  /** A parent's PIN unlocks every profile in the family. */
  role: "parent" | "player";
  /** Whether changes to this profile need its PIN. */
  hasPin: boolean;
  createdAt: string;
}

export interface UnlockResponse {
  profileId: string;
  token: string;
  expiresAt: string;
  byParent: boolean;
}

export interface Quota {
  date: string;
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

export type GenerationStatus = "PENDING" | "CALLING_PROVIDER" | "STORING" | "SUCCEEDED" | "FAILED";

export interface GenerationResponse {
  requestId: string;
  status: GenerationStatus;
  reservation: "RESERVED" | "CONSUMED" | "RELEASED";
  card: Card | null;
  error: { code: string; message: string } | null;
  quota: Quota;
}

/** Mirrors the API's validation limits so the UI can stop kids before the server does. */
export const LIMITS = {
  name: 24,
  attackName: 24,
  effect: 120,
  description: 400,
  flavorText: 160,
  hpMin: 10,
  hpMax: 500,
  damageMax: 300,
  attacks: 2,
  cost: 4,
  retreatMax: 4,
} as const;
