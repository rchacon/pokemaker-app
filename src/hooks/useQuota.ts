import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Quota } from "../types";

export function useQuota() {
  const [quota, setQuota] = useState<Quota | null>(null);

  const refresh = useCallback(async () => {
    try {
      setQuota(await api.getQuota());
    } catch {
      // Leave the last known value; the generate button handles errors itself.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { quota, setQuota, refresh };
}
