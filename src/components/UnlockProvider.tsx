import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { unlocks } from "../lib/unlock";
import type { Profile } from "../types";
import { PinDialog } from "./PinDialog";

interface UnlockApi {
  /**
   * Resolve true once `profile` may be changed (asking for its PIN if needed),
   * false if cancelled. Stable across renders, unlike the context object
   * itself, so it is safe in effect dependencies.
   */
  ensureUnlocked: (profile: Profile, options?: { force?: boolean }) => Promise<boolean>;
  /** Let a player choose (or change) their PIN. */
  choosePin: (profile: Profile) => Promise<boolean>;
  isUnlocked: (profile: Profile) => boolean;
  lock: (profileId: string) => void;
}

const UnlockContext = createContext<UnlockApi | null>(null);

interface Pending {
  profile: Profile;
  mode: "unlock" | "set";
  resolve: (ok: boolean) => void;
}

export function UnlockProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  // Bumped whenever unlock state changes; it's part of the context value below,
  // so components showing "Locked/Unlocked" re-render.
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const ask = useCallback(
    (profile: Profile, mode: Pending["mode"]) =>
      new Promise<boolean>((resolve) => setPending({ profile, mode, resolve })),
    [],
  );

  const ensureUnlocked = useCallback(
    (profile: Profile, options: { force?: boolean } = {}) => {
      if (options.force) unlocks.clear(profile.profileId);
      if (!profile.hasPin || unlocks.token(profile.profileId)) return Promise.resolve(true);
      return ask(profile, "unlock");
    },
    [ask],
  );

  const api = useMemo<UnlockApi>(
    () => ({
      ensureUnlocked,
      choosePin: async (profile) => (await ensureUnlocked(profile)) && ask(profile, "set"),
      isUnlocked: (profile) => !profile.hasPin || unlocks.token(profile.profileId) !== null,
      lock: (profileId) => {
        unlocks.clear(profileId);
        refresh();
      },
    }),
    // `tick` is listed so lock/unlock produces a new value and consumers re-render.
    [ensureUnlocked, ask, tick],
  );

  return (
    <UnlockContext.Provider value={api}>
      {children}
      {pending && (
        <PinDialog
          key={`${pending.profile.profileId}-${pending.mode}`}
          profile={pending.profile}
          mode={pending.mode}
          onDone={(ok) => {
            setPending(null);
            refresh();
            pending.resolve(ok);
          }}
        />
      )}
    </UnlockContext.Provider>
  );
}

export function useUnlock(): UnlockApi {
  const api = useContext(UnlockContext);
  if (!api) throw new Error("useUnlock must be used inside <UnlockProvider>");
  return api;
}
