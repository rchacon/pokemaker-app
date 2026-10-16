import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { Avatar } from "../components/Avatar";
import { PokemonCard } from "../components/PokemonCard";
import { ConfirmDialog, Notice } from "../components/ui";
import { useProfiles } from "../hooks/useProfiles";
import { ApiError, api } from "../lib/api";
import { lastProfile } from "../lib/drafts";
import type { Card } from "../types";

export function Gallery() {
  const { profileId = "" } = useParams();
  const { profiles } = useProfiles();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Card | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const profile = profiles?.find((p) => p.profileId === profileId);

  const load = useCallback(async () => {
    setError(null);
    try {
      setCards(await api.listCards(profileId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    }
  }, [profileId]);

  const unknownProfile = profiles !== null && !profile;

  useEffect(() => {
    if (unknownProfile) {
      lastProfile.clear();
      return;
    }
    lastProfile.set(profileId);
    void load();
  }, [profileId, load, unknownProfile]);

  if (unknownProfile) return <Navigate to="/players" replace />;

  const duplicate = async (card: Card) => {
    setBusy(card.cardId);
    try {
      const copy = await api.duplicateCard(profileId, card.cardId);
      setCards((current) => [...(current ?? []), copy]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't copy that card.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (card: Card) => {
    setToDelete(null);
    try {
      await api.deleteCard(profileId, card.cardId);
      setCards((current) => current?.filter((c) => c.cardId !== card.cardId) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't delete that card.");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        {profile && <Avatar avatar={profile.avatar} size="3.5rem" />}
        <h1 className="mr-auto font-display text-3xl font-bold sm:text-4xl">
          {profile ? `${profile.displayName}'s cards` : "My cards"}
        </h1>
        <Link to="/players" className="btn">
          🔄 Switch player
        </Link>
      </header>

      {error && (
        <div className="mb-4">
          <Notice tone="error">
            {error}{" "}
            <button className="underline" onClick={() => void load()}>
              Try again
            </button>
          </Notice>
        </div>
      )}

      {cards === null && !error && <p className="font-display text-xl">Loading your cards…</p>}

      {cards?.length === 0 && (
        <div className="panel mx-auto max-w-md p-8 text-center">
          <p className="font-display text-2xl font-semibold">No cards yet!</p>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Card collection">
        {cards?.map((card) => (
          <li key={card.cardId} className="flex flex-col gap-2">
            <PokemonCard card={card} />
            <div className="grid grid-cols-2 gap-1.5">
              <IconButton label={`Copy ${card.name}`} title="Make a copy" disabled={busy === card.cardId} onClick={() => void duplicate(card)}>
                📄
              </IconButton>
              <IconButton label={`Delete ${card.name}`} title="Delete" onClick={() => setToDelete(card)}>
                🗑️
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      {toDelete && (
        <ConfirmDialog
          title={`Delete ${toDelete.name || "this card"}?`}
          message="It will be gone forever, including its artwork."
          confirmLabel="Delete it"
          onCancel={() => setToDelete(null)}
          onConfirm={() => void remove(toDelete)}
        />
      )}
    </main>
  );
}

function IconButton({ label, title, disabled, onClick, children }: {
  label: string;
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className="btn btn-sm px-0 text-xl" aria-label={label} title={title} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
