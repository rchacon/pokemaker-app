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
  marginX: number;
  marginY: number;
  pages: Slot[][];
  /** x positions of vertical cut lines and y positions of horizontal ones. */
  cutsX: number[];
  cutsY: number[];
}

/**
 * Lay out `count` cards edge to edge, centered on Letter pages. Cards share
 * their cut lines, so one straight cut separates two cards.
 */
export function sheetLayout(count: number, columns = 3, rows = 3): SheetLayout {
  const marginX = (LETTER_WIDTH_IN - columns * CARD_WIDTH_IN) / 2;
  const marginY = (LETTER_HEIGHT_IN - rows * CARD_HEIGHT_IN) / 2;
  if (marginX < 0 || marginY < 0) throw new Error("Grid doesn't fit on Letter paper");
  const perPage = columns * rows;
  const pages: Slot[][] = [];
  for (let i = 0; i < count; i++) {
    const position = i % perPage;
    if (position === 0) pages.push([]);
    pages[pages.length - 1]!.push({
      x: marginX + (position % columns) * CARD_WIDTH_IN,
      y: marginY + Math.floor(position / columns) * CARD_HEIGHT_IN,
    });
  }
  const cutsX = Array.from({ length: columns + 1 }, (_, i) => marginX + i * CARD_WIDTH_IN);
  const cutsY = Array.from({ length: rows + 1 }, (_, i) => marginY + i * CARD_HEIGHT_IN);
  return { columns, rows, marginX, marginY, pages, cutsX, cutsY };
}
