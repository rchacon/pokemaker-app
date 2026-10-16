import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Profile } from "../types";

let cache: Promise<Profile[]> | null = null;

/** Profiles rarely change, so one request per page load is plenty (reload after a PIN change). */
export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    cache ??= api.listProfiles().catch((error: unknown) => {
      cache = null;
      throw error;
    });
    cache.then(setProfiles, () => setFailed(true));
  }, []);

  const reload = useCallback(() => {
    cache = null;
    load();
  }, [load]);

  useEffect(load, [load]);
  return { profiles, failed, retry: load, reload };
}

export function resetProfilesCache() {
  cache = null;
}
