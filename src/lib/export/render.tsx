import { toCanvas } from "html-to-image";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { PokemonCard } from "../../components/PokemonCard";
import type { CardView } from "../../types";
import { CARD_HEIGHT_IN, CARD_WIDTH_IN, CSS_PX_PER_IN, EXPORT_DPI } from "./layout";

/**
 * Rasterize a card exactly as the live preview draws it.
 *
 * The card is rendered off-screen at its true print size (2.5in = 240 CSS px)
 * and captured with a pixel ratio of DPI/96, so 300 DPI gives 750 x 1050 px.
 * Text is laid out at print size and rendered at full resolution.
 */
export async function renderCardCanvas(card: CardView, dpi = EXPORT_DPI): Promise<HTMLCanvasElement> {
  const width = CARD_WIDTH_IN * CSS_PX_PER_IN;
  const height = CARD_HEIGHT_IN * CSS_PX_PER_IN;
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px;pointer-events:none;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(<PokemonCard card={card} />));
    await document.fonts.ready;
    await Promise.all(
      Array.from(host.querySelectorAll("img")).map((img) => img.decode().catch(() => undefined)),
    );
    const node = host.firstElementChild as HTMLElement;
    return await toCanvas(node, {
      width,
      height,
      pixelRatio: dpi / CSS_PX_PER_IN,
      // Presigned URLs change every request; don't add cache-busting params
      // that would invalidate the signature.
      cacheBust: false,
    });
  } finally {
    root.unmount();
    host.remove();
  }
}
