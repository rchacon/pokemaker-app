import type { CardFields } from "../types";

/**
 * Unsaved edits live in localStorage so a closed tab, a dead battery or a lost
 * connection never loses a child's work. Every helper tolerates storage being
 * unavailable (private browsing, quota errors) — drafts are a safety net only.
 */

const PREFIX = "pokemaker:draft";
const LAST_PROFILE = "pokemaker:lastProfile";

export interface Draft {
  fields: CardFields;
  /** Server version the edits were based on; null for a card never saved. */
  baseVersion: number | null;
  savedAt: string;
}

const key = (profileId: string, cardId: string) => `${PREFIX}:${profileId}:${cardId}`;

function read<T>(storageKey: string): T | null {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(storageKey: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Storage full or blocked: carry on without the safety net.
  }
}

export const drafts = {
  get: (profileId: string, cardId: string) => read<Draft>(key(profileId, cardId)),
  set: (profileId: string, cardId: string, fields: CardFields, baseVersion: number | null) =>
    write(key(profileId, cardId), { fields, baseVersion, savedAt: new Date().toISOString() }),
  clear: (profileId: string, cardId: string) => write(key(profileId, cardId), null),
};

export const NEW_CARD = "new";

export const lastProfile = {
  get: () => read<string>(LAST_PROFILE),
  set: (profileId: string) => write(LAST_PROFILE, profileId),
  clear: () => write(LAST_PROFILE, null),
};
