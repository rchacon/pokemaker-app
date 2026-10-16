import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { PokemonCard } from "../components/PokemonCard";
import { SaveStatus } from "../components/SaveStatus";
import { CardForm } from "../components/editor/CardForm";
import { Notice } from "../components/ui";
import { useCardEditor } from "../hooks/useCardEditor";
import { useProfiles } from "../hooks/useProfiles";
import { ApiError, api } from "../lib/api";
import type { Card, CardView } from "../types";

export function Editor() {
  const { profileId = "", cardId } = useParams();
  const navigate = useNavigate();
  const editor = useCardEditor(profileId, cardId);
  const { profiles } = useProfiles();
  const profile = profiles?.find((p) => p.profileId === profileId);
  const [otherCards, setOtherCards] = useState<Card[]>([]);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    // Only used for "evolves from" suggestions, so failures are fine to ignore.
    api.listCards(profileId).then(
      (cards) => setOtherCards(cards.filter((c) => c.cardId !== cardId)),
      () => {},
    );
  }, [profileId, cardId]);

  const { fields, card } = editor;

  if (profiles && !profile) return <Navigate to="/players" replace />;

  if (editor.saveState === "missing") {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <Notice tone="error">That card doesn't exist anymore.</Notice>
        <Link to={`/p/${profileId}`} className="btn mt-4">
          ← Back to my cards
        </Link>
      </main>
    );
  }
  if (!fields) {
    return <p className="p-8 font-display text-xl">{editor.saveState === "error" ? "Couldn't load this card." : "Loading…"}</p>;
  }

  // The preview is drawn from the live form fields: no server round-trip.
  const preview: CardView = { ...fields, cardNumber: card?.cardNumber ?? null, artworkUrl: card?.artworkUrl ?? null };

  const saveNew = async (): Promise<Card | null> => {
    setProblem(null);
    try {
      const created = await editor.create();
      navigate(`/p/${profileId}/cards/${created.cardId}`, { replace: true });
      return created;
    } catch (e) {
      setProblem(e instanceof ApiError ? e.message : "Couldn't save the card. Try again!");
      return null;
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pt-4 pb-28 md:pb-10">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <Link to={`/p/${profileId}`} className="btn btn-sm">
          ← My cards
        </Link>
        <h1 className="mr-auto font-display text-2xl font-bold sm:text-3xl">{card ? "Edit card" : "New card"}</h1>
        <SaveStatus state={editor.saveState} />
        {!card && (
          <button className="btn btn-go" onClick={() => void saveNew()} disabled={editor.saveState === "saving"}>
            💾 Save card
          </button>
        )}
      </header>

      <div className="mb-4 flex flex-col gap-3">
        {problem && <Notice tone="error">{problem}</Notice>}
        {editor.errorMessage && <Notice tone="error">{editor.errorMessage}</Notice>}
        {editor.conflict && (
          <Notice tone="warn">
            This card was changed somewhere else (maybe another tablet). Which one do you want to keep?
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="btn btn-sm btn-primary" onClick={() => editor.resolveConflict("mine")}>
                Keep mine
              </button>
              <button className="btn btn-sm" onClick={() => editor.resolveConflict("theirs")}>
                Use the other one
              </button>
            </div>
          </Notice>
        )}
        {editor.staleDraft && (
          <Notice tone="info">
            We found some changes you didn't save last time.
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="btn btn-sm btn-primary" onClick={() => editor.resolveStaleDraft(true)}>
                Bring them back
              </button>
              <button className="btn btn-sm" onClick={() => editor.resolveStaleDraft(false)}>
                No thanks
              </button>
            </div>
          </Notice>
        )}
      </div>

      <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(260px,380px)] md:gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className={view === "edit" ? "" : "hidden md:block"}>
          <CardForm
            fields={fields}
            onChange={editor.update}
            otherCards={otherCards}
          />
        </div>

        <aside className={view === "preview" ? "" : "hidden md:block"} aria-label="Card preview">
          <div className="flex flex-col gap-4 md:sticky md:top-4">
            <div className="mx-auto w-full max-w-[340px] md:max-w-none">
              <PokemonCard card={preview} showArtHint />
            </div>
          </div>
        </aside>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t-3 border-ink bg-cream p-3 md:hidden" aria-label="Editor view">
        <button className={`btn flex-1 ${view === "edit" ? "btn-primary" : ""}`} aria-pressed={view === "edit"} onClick={() => setView("edit")}>
          ✏️ Edit
        </button>
        <button
          className={`btn flex-1 ${view === "preview" ? "btn-primary" : ""}`}
          aria-pressed={view === "preview"}
          onClick={() => setView("preview")}
        >
          👀 See card
        </button>
      </nav>
    </main>
  );
}
