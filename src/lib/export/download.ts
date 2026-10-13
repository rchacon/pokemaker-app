import type { CardView } from "../../types";
import { CARD_HEIGHT_IN, CARD_WIDTH_IN, EXPORT_DPI, LETTER_HEIGHT_IN, LETTER_WIDTH_IN, sheetLayout } from "./layout";
import { dataUrlToBytes, setPngDpi } from "./png";
import { renderCardCanvas } from "./render";

export function cardFileName(card: CardView, extension: string): string {
  const slug = (card.name || "card").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "card";
  return `${slug}.${extension}`;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** A 300-DPI PNG (750 x 1050 px) tagged so it prints at 2.5 x 3.5 inches. */
export async function downloadCardPng(card: CardView): Promise<void> {
  const canvas = await renderCardCanvas(card, EXPORT_DPI);
  const png = setPngDpi(dataUrlToBytes(canvas.toDataURL("image/png")), EXPORT_DPI);
  saveBlob(new Blob([png as BlobPart], { type: "image/png" }), cardFileName(card, "png"));
}

/**
 * A Letter-size PDF with up to nine cards per page, each placed at exactly
 * 2.5 x 3.5 inches. Cut guides are vector lines; cards are 300-DPI images.
 * (For vector text, use Print → "Save as PDF", which prints the live HTML.)
 */
export async function downloadCardsPdf(cards: CardView[], { guides = true } = {}): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "in", format: "letter", orientation: "portrait" });
  const layout = sheetLayout(cards.length);
  let index = 0;
  for (const [pageNumber, slots] of layout.pages.entries()) {
    if (pageNumber > 0) pdf.addPage("letter", "portrait");
    for (const slot of slots) {
      const canvas = await renderCardCanvas(cards[index++]!, EXPORT_DPI);
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", slot.x, slot.y, CARD_WIDTH_IN, CARD_HEIGHT_IN);
    }
    if (guides) drawCutGuides(pdf, layout);
  }
  pdf.save(cards.length === 1 ? cardFileName(cards[0]!, "pdf") : "pokemaker-cards.pdf");
}

function drawCutGuides(pdf: import("jspdf").jsPDF, layout: ReturnType<typeof sheetLayout>) {
  const mark = 0.18; // inches of crop mark outside the grid
  const gap = 0.04;
  const top = layout.cutsY[0]!;
  const bottom = layout.cutsY.at(-1)!;
  const left = layout.cutsX[0]!;
  const right = layout.cutsX.at(-1)!;
  pdf.setDrawColor(120);
  pdf.setLineWidth(0.01);
  for (const x of layout.cutsX) {
    pdf.line(x, Math.max(0, top - gap - mark), x, top - gap);
    pdf.line(x, bottom + gap, x, Math.min(LETTER_HEIGHT_IN, bottom + gap + mark));
  }
  for (const y of layout.cutsY) {
    pdf.line(Math.max(0, left - gap - mark), y, left - gap, y);
    pdf.line(right + gap, y, Math.min(LETTER_WIDTH_IN, right + gap + mark), y);
  }
}
