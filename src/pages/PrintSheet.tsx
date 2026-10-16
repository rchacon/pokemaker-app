import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { PokemonCard } from "../components/PokemonCard";
import { Notice } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { downloadCardsPdf } from "../lib/export/download";
import {
  CARD_HEIGHT_IN,
  CARD_SPACINGS,
  CARD_WIDTH_IN,
  CSS_PX_PER_IN,
  LETTER_HEIGHT_IN,
  LETTER_WIDTH_IN,
  sheetLayout,
} from "../lib/export/layout";
import type { Card } from "../types";
import "./PrintSheet.css";

const inch = (value: number) => `${value}in`;

const SPACING_KEY = "pokemaker:printSpacing";
/** Default: room between cards so laminating the whole sheet seals each card. */
const DEFAULT_SPACING = 0.25;

function savedSpacing(): number {
  try {
    const value = Number(localStorage.getItem(SPACING_KEY));
    return CARD_SPACINGS.some((s) => s.gap === value) && localStorage.getItem(SPACING_KEY) !== null
      ? value
      : DEFAULT_SPACING;
  } catch {
    return DEFAULT_SPACING;
  }
}

export function PrintSheet() {
  const { profileId = "" } = useParams();
  const [params] = useSearchParams();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [guides, setGuides] = useState(true);
  const [spacing, setSpacingState] = useState(savedSpacing);
  const setSpacing = (gap: number) => {
    setSpacingState(gap);
    try {
      localStorage.setItem(SPACING_KEY, String(gap));
    } catch {
      // Not remembered; that's fine.
    }
  };
  const [error, setError] = useState<string | null>(null);
  const [making, setMaking] = useState(false);

  useEffect(() => {
    api.listCards(profileId).then(
      (loaded) => {
        setCards(loaded);
        const wanted = params.get("ids")?.split(",").filter(Boolean);
        setSelected(new Set(wanted?.length ? wanted : loaded.map((c) => c.cardId)));
      },
      (e: unknown) => setError(e instanceof ApiError ? e.message : "Couldn't load your cards."),
    );
  }, [profileId, params]);

  const chosen = useMemo(() => cards?.filter((c) => selected.has(c.cardId)) ?? [], [cards, selected]);
  const layout = sheetLayout(chosen.length, { gap: spacing });

  const toggle = (cardId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });

  const makePdf = async () => {
    setMaking(true);
    try {
      await downloadCardsPdf(chosen, { guides, gap: spacing });
    } catch {
      setError("Couldn't make the PDF. Try again!");
    } finally {
      setMaking(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 print:m-0 print:max-w-none print:p-0">
      <div className="print:hidden">
        <header className="mb-4 flex flex-wrap items-center gap-2">
          <Link to={`/p/${profileId}`} className="btn btn-sm">
            ← My cards
          </Link>
          <h1 className="mr-auto font-display text-3xl font-bold">Print cards</h1>
          <label className="flex items-center gap-2 font-bold">
            <input type="checkbox" className="size-5" checked={guides} onChange={(e) => setGuides(e.target.checked)} />
            Cutting guides
          </label>
          <button className="btn" onClick={() => void makePdf()} disabled={chosen.length === 0 || making}>
            {making ? "Making PDF…" : "📄 Download PDF"}
          </button>
          <button className="btn btn-primary" onClick={() => window.print()} disabled={chosen.length === 0}>
            🖨️ Print
          </button>
        </header>
        <div className="mb-3 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Spacing between cards">
          <span className="font-bold">Spacing between cards:</span>
          {CARD_SPACINGS.map((option) => (
            <button
              key={option.gap}
              type="button"
              role="radio"
              aria-checked={spacing === option.gap}
              className={`btn btn-sm ${spacing === option.gap ? "btn-primary" : ""}`}
              onClick={() => setSpacing(option.gap)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mb-3 font-semibold text-ink-soft">
          Cards print at real size (2.5 × 3.5 inches), {layout.columns * layout.rows} on a sheet of Letter paper.
          {spacing > 0
            ? ` Laminate the whole sheet, then cut along the dashed lines in the middle of each gap: every card keeps a ${
                spacing === 0.25 ? "⅛-inch" : "1/16-inch"
              } sealed edge.`
            : " Cut along the card edges."}{" "}
          In the print window, choose "Actual size" or 100% scale.
        </p>
        {error && <Notice tone="error">{error}</Notice>}
        {cards && (
          <ul className="mb-6 flex flex-wrap gap-2" aria-label="Choose cards">
            {cards.map((card) => (
              <li key={card.cardId}>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border-3 border-ink bg-white px-3 py-1.5 font-bold">
                  <input type="checkbox" className="size-5" checked={selected.has(card.cardId)} onChange={() => toggle(card.cardId)} />
                  {card.name || "Untitled"}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col items-center gap-6 print:block">
        {layout.pages.map((slots, pageIndex) => (
          <ScaledSheet key={pageIndex}>
            <div className="print-sheet" style={{ width: inch(LETTER_WIDTH_IN), height: inch(LETTER_HEIGHT_IN) }} data-testid="print-sheet">
              {slots.map((slot, i) => {
                const card = chosen[pageIndex * layout.columns * layout.rows + i]!;
                return (
                  <div
                    key={card.cardId}
                    // Outline the card edge only when that's where to cut (no spacing).
                    className={`print-slot ${guides && layout.gap === 0 ? "print-slot--guides" : ""}`}
                    data-testid="print-slot"
                    style={{ left: inch(slot.x), top: inch(slot.y), width: inch(CARD_WIDTH_IN), height: inch(CARD_HEIGHT_IN) }}
                  >
                    <PokemonCard card={card} />
                  </div>
                );
              })}
              {guides && <CropMarks layout={layout} />}
              {guides && layout.gap > 0 && <CutLines layout={layout} />}
            </div>
          </ScaledSheet>
        ))}
      </div>
    </main>
  );
}

/** Crop marks in the page margins, lined up with every cut. */
function CropMarks({ layout }: { layout: ReturnType<typeof sheetLayout> }) {
  const mark = 0.18;
  const gap = 0.04;
  const top = layout.cutsY[0]!;
  const bottom = layout.cutsY.at(-1)!;
  const left = layout.cutsX[0]!;
  const right = layout.cutsX.at(-1)!;
  return (
    <>
      {layout.cutsX.flatMap((x) => [
        <span key={`t${x}`} className="crop-mark crop-mark--v" style={{ left: inch(x), top: inch(top - gap - mark), height: inch(mark) }} />,
        <span key={`b${x}`} className="crop-mark crop-mark--v" style={{ left: inch(x), top: inch(bottom + gap), height: inch(mark) }} />,
      ])}
      {layout.cutsY.flatMap((y) => [
        <span key={`l${y}`} className="crop-mark crop-mark--h" style={{ top: inch(y), left: inch(left - gap - mark), width: inch(mark) }} />,
        <span key={`r${y}`} className="crop-mark crop-mark--h" style={{ top: inch(y), left: inch(right + gap), width: inch(mark) }} />,
      ])}
    </>
  );
}

/** Dashed cut lines through the middle of each gap (only drawn when cards are spaced apart). */
function CutLines({ layout }: { layout: ReturnType<typeof sheetLayout> }) {
  const top = layout.cutsY[0]!;
  const bottom = layout.cutsY.at(-1)!;
  const left = layout.cutsX[0]!;
  const right = layout.cutsX.at(-1)!;
  return (
    <>
      {layout.cutsX.map((x) => (
        <span key={`x${x}`} className="cut-line cut-line--v" data-testid="cut-line" style={{ left: inch(x), top: inch(top), height: inch(bottom - top) }} />
      ))}
      {layout.cutsY.map((y) => (
        <span key={`y${y}`} className="cut-line cut-line--h" data-testid="cut-line" style={{ top: inch(y), left: inch(left), width: inch(right - left) }} />
      ))}
    </>
  );
}

/** On screen, shrink the full-size sheet to fit; when printing it's always 100%. */
function ScaledSheet({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const available = entry?.contentRect.width ?? 0;
      setScale(Math.min(1, available / (LETTER_WIDTH_IN * CSS_PX_PER_IN)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full print:w-auto">
      <div className="scaled-sheet mx-auto" style={{ zoom: scale }}>
        {children}
      </div>
    </div>
  );
}
