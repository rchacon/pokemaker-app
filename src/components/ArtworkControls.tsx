import { friendlyResetTime } from "../hooks/useArtworkGeneration";
import type { Quota } from "../types";
import { Notice } from "./ui";

interface Props {
  quota: Quota | null;
  hasArtwork: boolean;
  hasDescription: boolean;
  working: boolean;
  message: string | null;
  onGenerate: () => void;
}

export function QuotaMeter({ quota }: { quota: Quota | null }) {
  if (!quota) return null;
  return (
    <p className="text-center text-sm font-bold text-ink-soft" data-testid="quota">
      Artwork generations remaining today: {quota.remaining} / {quota.limit}
    </p>
  );
}

export function ArtworkControls({ quota, hasArtwork, hasDescription, working, message, onGenerate }: Props) {
  const exhausted = quota !== null && quota.remaining <= 0;
  const disabled = working || exhausted || !hasDescription;
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn btn-magic btn-lg w-full" disabled={disabled} onClick={onGenerate}>
        {working ? "🎨 Drawing your creature…" : hasArtwork ? "🎨 Draw new artwork" : "🎨 Generate artwork"}
      </button>
      <QuotaMeter quota={quota} />
      {exhausted && quota && (
        <Notice tone="warn">
          You've used all of today's artwork. More arrive at {friendlyResetTime(quota.resetsAt)}! You can still edit
          your cards.
        </Notice>
      )}
      {!hasDescription && !exhausted && (
        <p className="text-center text-sm font-semibold text-ink-soft">Describe your creature first, then tap the button!</p>
      )}
      {message && <Notice tone="error">{message}</Notice>}
    </div>
  );
}
