/**
 * Small localStorage helpers. Every helper tolerates storage being unavailable
 * (private browsing, quota errors): what's stored here is a convenience only.
 */

const LAST_PROFILE = "pokemaker:lastProfile";

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

export const lastProfile = {
  get: () => read<string>(LAST_PROFILE),
  set: (profileId: string) => write(LAST_PROFILE, profileId),
  clear: () => write(LAST_PROFILE, null),
};
