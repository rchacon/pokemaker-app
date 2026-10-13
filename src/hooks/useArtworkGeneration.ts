import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "../lib/api";
import { pendingGeneration } from "../lib/drafts";
import type { Card, GenerationResponse, Quota } from "../types";

const POLL_MS = 3000;
const POLL_FOR_MS = 3 * 60 * 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function friendlyResetTime(resetsAt: string): string {
  return new Date(resetsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Generates artwork for a saved card.
 *
 * Each press gets a fresh request id (the Idempotency-Key). If the response is
 * lost — API Gateway gives up after 30 s, Wi-Fi drops, the page reloads — we
 * never press "generate" again on the child's behalf (that could cost twice).
 * Instead we poll the original request until it finishes. The id is kept in
 * localStorage so a reloaded page resumes polling too.
 */
export function useArtworkGeneration(options: {
  profileId: string;
  cardId: string | null;
  onArtwork: (card: Card) => void;
  onQuota: (quota: Quota) => void;
}) {
  const { profileId, cardId } = options;
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const callbacks = useRef(options);
  callbacks.current = options;
  const alive = useRef(true);
  // The one request this card is waiting on. Guards against double taps and
  // against a resumed poll overlapping a fresh one.
  const active = useRef<string | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const settle = useCallback((result: GenerationResponse, forCard: string) => {
    callbacks.current.onQuota(result.quota);
    if (result.status === "SUCCEEDED") {
      pendingGeneration.clear(forCard);
      if (result.card) callbacks.current.onArtwork(result.card);
      setMessage(null);
      return true;
    }
    if (result.status === "FAILED") {
      pendingGeneration.clear(forCard);
      setMessage(result.error?.message ?? "The artwork didn't work out. Try again!");
      return true;
    }
    return false; // still in progress
  }, []);

  const poll = useCallback(
    async (requestId: string, forCard: string) => {
      const deadline = Date.now() + POLL_FOR_MS;
      while (alive.current && Date.now() < deadline) {
        await sleep(POLL_MS);
        if (!alive.current) return;
        try {
          if (settle(await api.getGeneration(requestId), forCard)) return;
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) break;
          // Network blip: keep polling.
        }
      }
      if (alive.current) {
        pendingGeneration.clear(forCard);
        setMessage("The artwork is taking a long time. Check back in a minute!");
      }
    },
    [settle],
  );

  // Resume a generation that was in flight when the page was closed.
  useEffect(() => {
    if (!cardId || active.current) return;
    const requestId = pendingGeneration.get(cardId);
    if (!requestId) return;
    active.current = requestId;
    setWorking(true);
    void poll(requestId, cardId).finally(() => {
      active.current = null;
      if (alive.current) setWorking(false);
    });
  }, [cardId, poll]);

  const generate = useCallback(
    async (description: string, forCard: string = cardId ?? "") => {
      if (!forCard || active.current) return;
      const requestId = crypto.randomUUID();
      active.current = requestId;
      pendingGeneration.set(forCard, requestId);
      setWorking(true);
      setMessage(null);
      try {
        const result = await api.generateArtwork(profileId, forCard, requestId, description);
        if (!settle(result, forCard)) await poll(requestId, forCard);
      } catch (error) {
        if (error instanceof ApiError && error.isStructured) {
          // The API answered definitively (quota, rejected prompt, ...).
          pendingGeneration.clear(forCard);
          const quota = error.details.quota as Quota | undefined;
          if (quota) callbacks.current.onQuota(quota);
          setMessage(
            error.code === "QUOTA_EXCEEDED" && quota
              ? `No more artwork today. More arrive at ${friendlyResetTime(quota.resetsAt)}!`
              : error.message,
          );
        } else {
          // Gateway timeout or network error: the request may still be running.
          await poll(requestId, forCard);
        }
      } finally {
        active.current = null;
        if (alive.current) setWorking(false);
      }
    },
    [cardId, profileId, settle, poll],
  );

  return { generate, working, message, clearMessage: () => setMessage(null) };
}
