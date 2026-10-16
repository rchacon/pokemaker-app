import type { UnlockResponse } from "../types";

/**
 * Unlock tokens for PIN-protected profiles.
 *
 * Kept in sessionStorage: they vanish when the tab closes, and the app clears
 * them whenever someone switches player, so a kid who walks away from an
 * unlocked profile doesn't leave it open for a sibling. The API is what
 * actually enforces the PIN; this just remembers the proof of unlocking.
 */

const KEY = "pokemaker:unlock";
const EARLY_EXPIRY_MS = 30_000; // treat tokens as expired slightly early

type Store = Record<string, { token: string; expiresAt: string }>;

function load(): Store {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function save(store: Store): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Storage blocked: the child will just be asked for the PIN again.
  }
}

export const unlocks = {
  token(profileId: string): string | null {
    const entry = load()[profileId];
    if (!entry) return null;
    return Date.parse(entry.expiresAt) - EARLY_EXPIRY_MS > Date.now() ? entry.token : null;
  },
  set(response: UnlockResponse): void {
    save({ ...load(), [response.profileId]: { token: response.token, expiresAt: response.expiresAt } });
  },
  clear(profileId: string): void {
    const store = load();
    delete store[profileId];
    save(store);
  },
  /** Forget every profile except `keep` (used when switching players). */
  clearAllExcept(keep?: string): void {
    const store = load();
    save(keep && store[keep] ? { [keep]: store[keep]! } : {});
  },
};
