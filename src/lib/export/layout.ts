/**
 * Print geometry. Everything is in inches; a standard trading card is
 * 2.5 x 3.5 in, and nine fit on US Letter (8.5 x 11 in) in a 3 x 3 grid.
 */

export const CARD_WIDTH_IN = 2.5;
export const CARD_HEIGHT_IN = 3.5;
export const LETTER_WIDTH_IN = 8.5;
export const LETTER_HEIGHT_IN = 11;
export const CSS_PX_PER_IN = 96;
export const POINTS_PER_IN = 72;
export const EXPORT_DPI = 300;

/** Pixel size of a card PNG at the given DPI (750 x 1050 at 300 DPI). */
export function cardPixelSize(dpi = EXPORT_DPI) {
  return { width: Math.round(CARD_WIDTH_IN * dpi), height: Math.round(CARD_HEIGHT_IN * dpi) };
}

export interface Slot {
  x: number; // inches from the left edge of the page
  y: number; // inches from the top edge
}

export interface SheetLayout {
  columns: number;
  rows: number;
  /** Space between neighbouring cards (inches). */
  gap: number;
  marginX: number;
  marginY: number;
  pages: Slot[][];
  /**
   * x positions of vertical cut lines and y positions of horizontal ones.
   * With no gap they are the card edges (neighbours share a cut). With a gap
   * they run down the middle of each gap and gap/2 outside the outer cards,
   * so every card keeps a gap/2 border: after laminating the whole sheet,
   * that border is where the plastic seals around the card.
   */
  cutsX: number[];
  cutsY: number[];
}

/** Keep cards at least this far from the paper edge (most printers can't print closer). */
export const MIN_PRINT_MARGIN_IN = 0.25;

/** Spacing choices offered on the print page. */
export const CARD_SPACINGS = [
  { gap: 0, label: "None" },
  { gap: 0.125, label: "⅛ in" },
  { gap: 0.25, label: "¼ in" },
] as const;

/** How many cards of `size` fit along `length` with `gap` between them. */
function fit(length: number, size: number, gap: number): number {
  return Math.floor((length - 2 * MIN_PRINT_MARGIN_IN + gap) / (size + gap));
}

/**
 * Lay out `count` cards centered on Letter pages, as many per page as fit
 * with the requested `gap` between them: 9 (3 x 3) with no gap, 6 (3 x 2)
 * with a gap of up to 1/4 inch.
 */
export function sheetLayout(count: number, { gap = 0 }: { gap?: number } = {}): SheetLayout {
  const columns = fit(LETTER_WIDTH_IN, CARD_WIDTH_IN, gap);
  const rows = fit(LETTER_HEIGHT_IN, CARD_HEIGHT_IN, gap);
  if (columns < 1 || rows < 1) throw new Error("Cards don't fit on Letter paper with that spacing");
  const pitchX = CARD_WIDTH_IN + gap;
  const pitchY = CARD_HEIGHT_IN + gap;
  const marginX = (LETTER_WIDTH_IN - (columns * pitchX - gap)) / 2;
  const marginY = (LETTER_HEIGHT_IN - (rows * pitchY - gap)) / 2;
  const perPage = columns * rows;
  const pages: Slot[][] = [];
  for (let i = 0; i < count; i++) {
    const position = i % perPage;
    if (position === 0) pages.push([]);
    pages[pages.length - 1]!.push({
      x: marginX + (position % columns) * pitchX,
      y: marginY + Math.floor(position / columns) * pitchY,
    });
  }
  const cutsX = Array.from({ length: columns + 1 }, (_, i) => marginX - gap / 2 + i * pitchX);
  const cutsY = Array.from({ length: rows + 1 }, (_, i) => marginY - gap / 2 + i * pitchY);
  return { columns, rows, gap, marginX, marginY, pages, cutsX, cutsY };
}
