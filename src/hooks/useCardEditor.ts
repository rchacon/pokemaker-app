import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "../lib/api";
import { newCardFields, sameFields, toFields } from "../lib/cardDefaults";
import { NEW_CARD, drafts, type Draft } from "../lib/drafts";
import type { Card, CardFields } from "../types";

export type SaveState =
  | "loading"
  | "new" // never saved; lives only in the local draft
  | "saved"
  | "dirty" // waiting for the autosave debounce
  | "saving"
  | "offline" // couldn't reach the server; kept locally and retrying
  | "conflict" // someone saved a newer version elsewhere
  | "error"
  | "missing";

const RETRY_MS = 5000;

/**
 * Loads a card, keeps the editable fields in state, and autosaves them.
 *
 * - Every change is written to localStorage immediately (so nothing is lost),
 *   then saved to the API after a short debounce.
 * - Saves never overlap: a change made during a save triggers one more save
 *   afterwards, so the server always ends up with the latest fields.
 * - Each save sends the version it was based on. If the server has a newer
 *   one (another tab or device), the API answers 409 and we ask the child
 *   which version to keep instead of overwriting silently.
 */
export function useCardEditor(profileId: string, cardId: string | undefined, debounceMs = 1000) {
  const [fields, setFieldsState] = useState<CardFields | null>(null);
  const [card, setCardState] = useState<Card | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [conflict, setConflict] = useState<Card | null>(null);
  const [staleDraft, setStaleDraft] = useState<Draft | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs hold the latest values for async callbacks (timers, in-flight saves).
  const fieldsRef = useRef<CardFields | null>(null);
  const cardRef = useRef<Card | null>(null);
  const conflictRef = useRef<Card | null>(null);
  const savingRef = useRef(false);
  const saveAgainRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveRef = useRef<() => Promise<void>>(async () => {});

  const setFields = (value: CardFields) => {
    fieldsRef.current = value;
    setFieldsState(value);
  };
  const setCard = (value: Card | null) => {
    cardRef.current = value;
    setCardState(value);
  };

  const schedule = useCallback(
    (delay = debounceMs) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void saveRef.current(), delay);
    },
    [debounceMs],
  );

  // --- Load ------------------------------------------------------------------
  useEffect(() => {
    if (!cardId) {
      const draft = drafts.get(profileId, NEW_CARD);
      setCard(null);
      setFields(draft?.fields ?? newCardFields());
      setSaveState("new");
      return;
    }
    if (cardRef.current?.cardId === cardId) return; // just created here; already loaded

    let cancelled = false;
    setSaveState("loading");
    api
      .getCard(profileId, cardId)
      .then((loaded) => {
        if (cancelled) return;
        const server = toFields(loaded);
        const draft = drafts.get(profileId, cardId);
        let initial = server;
        let state: SaveState = "saved";
        if (draft && !sameFields(draft.fields, server)) {
          if (draft.baseVersion === loaded.version) {
            // Our own edits that never reached the server: restore and save them.
            initial = draft.fields;
            state = "dirty";
          } else {
            // Edits based on an older version: let the child decide.
            setStaleDraft(draft);
          }
        } else if (draft) {
          drafts.clear(profileId, cardId);
        }
        setCard(loaded);
        setFields(initial);
        setSaveState(state);
        if (state === "dirty") schedule();
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSaveState(error instanceof ApiError && error.status === 404 ? "missing" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [profileId, cardId, schedule]);

  // Save anything pending when leaving the editor.
  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      const current = cardRef.current;
      const latest = fieldsRef.current;
      if (current && latest && !conflictRef.current && !sameFields(latest, toFields(current))) {
        void api.updateCard(profileId, current.cardId, latest, current.version).then(
          () => drafts.clear(profileId, current.cardId),
          () => {}, // the local draft keeps the edits
        );
      }
    },
    [profileId],
  );

  // --- Save ------------------------------------------------------------------
  const save = useCallback(async () => {
    const current = cardRef.current;
    const latest = fieldsRef.current;
    if (!current || !latest || conflictRef.current) return;
    if (savingRef.current) {
      saveAgainRef.current = true;
      return;
    }
    if (sameFields(latest, toFields(current))) {
      drafts.clear(profileId, current.cardId);
      setSaveState("saved");
      return;
    }

    savingRef.current = true;
    setSaveState("saving");
    let retry = false;
    try {
      const updated = await api.updateCard(profileId, current.cardId, latest, current.version);
      setCard(updated);
      setErrorMessage(null);
      if (fieldsRef.current && sameFields(fieldsRef.current, toFields(updated))) {
        drafts.clear(profileId, updated.cardId);
        setSaveState("saved");
      } else {
        saveAgainRef.current = true; // edited while we were saving
        setSaveState("dirty");
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === "VERSION_CONFLICT") {
        const newer = error.details.current as Card;
        conflictRef.current = newer;
        setConflict(newer);
        setSaveState("conflict");
      } else if (error instanceof ApiError && error.isStructured && error.status < 500) {
        setErrorMessage(error.message);
        setSaveState("error");
      } else {
        setSaveState("offline");
        retry = true;
      }
    } finally {
      savingRef.current = false;
    }
    if (retry) schedule(RETRY_MS);
    else if (saveAgainRef.current && !conflictRef.current) {
      saveAgainRef.current = false;
      schedule(0);
    }
  }, [profileId, schedule]);
  saveRef.current = save;

  // --- Edit ------------------------------------------------------------------
  const update = useCallback(
    (next: CardFields | ((previous: CardFields) => CardFields)) => {
      const previous = fieldsRef.current;
      if (!previous) return;
      const value = typeof next === "function" ? next(previous) : next;
      setFields(value);
      const current = cardRef.current;
      drafts.set(profileId, current?.cardId ?? NEW_CARD, value, current?.version ?? null);
      if (current && !conflictRef.current) {
        setSaveState("dirty");
        schedule();
      }
    },
    [profileId, schedule],
  );

  /** First save of a new card. Returns the created card so the page can switch URLs. */
  const create = useCallback(async (): Promise<Card> => {
    const latest = fieldsRef.current ?? newCardFields();
    setSaveState("saving");
    try {
      const created = await api.createCard(profileId, latest);
      drafts.clear(profileId, NEW_CARD);
      setCard(created);
      setFields(toFields(created));
      setSaveState("saved");
      return created;
    } catch (error) {
      setSaveState("new");
      throw error;
    }
  }, [profileId]);

  /** Merge artwork from a finished generation without touching unsaved text edits. */
  const applyArtwork = useCallback((updated: Card) => {
    const current = cardRef.current;
    if (!current || current.cardId !== updated.cardId) return;
    setCard({
      ...current,
      artworkKey: updated.artworkKey,
      artworkUrl: updated.artworkUrl,
      artworkVersion: updated.artworkVersion,
    });
  }, []);

  const resolveConflict = useCallback(
    (keep: "mine" | "theirs") => {
      const newer = conflictRef.current;
      if (!newer) return;
      conflictRef.current = null;
      setConflict(null);
      setCard(newer);
      if (keep === "theirs") {
        setFields(toFields(newer));
        drafts.clear(profileId, newer.cardId);
        setSaveState("saved");
      } else {
        // Re-base our edits on the newer version and save them over it.
        if (fieldsRef.current) drafts.set(profileId, newer.cardId, fieldsRef.current, newer.version);
        void saveRef.current();
      }
    },
    [profileId],
  );

  const resolveStaleDraft = useCallback(
    (keep: boolean) => {
      const draft = staleDraft;
      setStaleDraft(null);
      if (!draft || !cardRef.current) return;
      if (keep) update(draft.fields);
      else drafts.clear(profileId, cardRef.current.cardId);
    },
    [staleDraft, update, profileId],
  );

  const saveNow = useCallback(() => {
    clearTimeout(timerRef.current);
    return saveRef.current();
  }, []);

  return {
    fields,
    card,
    saveState,
    conflict,
    staleDraft,
    errorMessage,
    update,
    create,
    saveNow,
    applyArtwork,
    resolveConflict,
    resolveStaleDraft,
  };
}
