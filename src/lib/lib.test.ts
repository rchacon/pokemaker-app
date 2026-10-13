import { describe, expect, it } from "vitest";
import { makeCard } from "../test/fixtures";
import { changeType, newCardFields, sameFields, toFields } from "./cardDefaults";
import { drafts } from "./drafts";
import { CARD_HEIGHT_IN, CARD_WIDTH_IN, cardPixelSize, LETTER_HEIGHT_IN, LETTER_WIDTH_IN, sheetLayout } from "./export/layout";
import { dataUrlToBytes, pngSize, readPngDpi, setPngDpi } from "./export/png";
import { fitFontSize } from "./textFit";

// A 1x1 transparent PNG.
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

describe("export dimensions", () => {
  it("cards are 2.5 x 3.5 inches and 750 x 1050 px at 300 DPI", () => {
    expect([CARD_WIDTH_IN, CARD_HEIGHT_IN]).toEqual([2.5, 3.5]);
    expect(cardPixelSize(300)).toEqual({ width: 750, height: 1050 });
    expect(cardPixelSize(600)).toEqual({ width: 1500, height: 2100 });
  });

  it("fits nine cards per Letter page, centered, sharing cut lines", () => {
    const layout = sheetLayout(11);
    expect(layout.pages.map((p) => p.length)).toEqual([9, 2]);
    expect(layout.marginX).toBeCloseTo(0.5);
    expect(layout.marginY).toBeCloseTo(0.25);
    const first = layout.pages[0]!;
    expect(first[0]).toEqual({ x: 0.5, y: 0.25 });
    expect(first[1]).toEqual({ x: 3, y: 0.25 });
    expect(first[3]).toEqual({ x: 0.5, y: 3.75 });
    const last = first[8]!;
    expect(last.x + CARD_WIDTH_IN).toBeCloseTo(LETTER_WIDTH_IN - 0.5);
    expect(last.y + CARD_HEIGHT_IN).toBeCloseTo(LETTER_HEIGHT_IN - 0.25);
    expect(layout.cutsX).toEqual([0.5, 3, 5.5, 8]);
    expect(layout.cutsY).toEqual([0.25, 3.75, 7.25, 10.75]);
  });

  it("tags PNGs with their print resolution", () => {
    const png = dataUrlToBytes(TINY_PNG);
    expect(readPngDpi(png)).toBeNull();
    const tagged = setPngDpi(png, 300);
    expect(readPngDpi(tagged)).toBe(300);
    expect(pngSize(tagged)).toEqual({ width: 1, height: 1 });
    // Re-tagging replaces rather than duplicates the chunk.
    const retagged = setPngDpi(tagged, 600);
    expect(readPngDpi(retagged)).toBe(600);
    expect(retagged.length).toBe(tagged.length);
  });
});

describe("long text", () => {
  it("keeps short text at full size", () => {
    expect(fitFontSize("Layla", 7.4, 11, 4.2)).toBe(7.4);
  });

  it("shrinks long text proportionally down to a minimum", () => {
    expect(fitFontSize("Supercalifragil", 7.4, 11, 4.2)).toBeCloseTo(5.43, 1);
    expect(fitFontSize("x".repeat(60), 7.4, 11, 4.2)).toBe(4.2);
  });

  it("counts emoji as single characters", () => {
    expect(fitFontSize("🔥".repeat(11), 7.4, 11, 4.2)).toBe(7.4);
  });
});

describe("card defaults", () => {
  it("starts with one attack paid with the card's own type", () => {
    const fields = newCardFields("water");
    expect(fields.attacks).toHaveLength(1);
    expect(fields.attacks[0]!.cost).toEqual(["water"]);
    expect(fields.weakness).toBe("lightning");
  });

  it("changing type updates defaults but keeps the child's own choices", () => {
    const fields = { ...newCardFields("fire"), attacks: [
      { name: "a", damage: 10, cost: ["fire" as const, "fire" as const], effect: "" },
      { name: "b", damage: 10, cost: ["fire" as const, "metal" as const], effect: "" },
    ] };
    const water = changeType(fields, "water");
    expect(water.weakness).toBe("lightning");
    expect(water.attacks[0]!.cost).toEqual(["water", "water"]);
    expect(water.attacks[1]!.cost).toEqual(["fire", "metal"]);

    const custom = changeType({ ...fields, weakness: "dragon" }, "grass");
    expect(custom.weakness).toBe("dragon");
  });

  it("compares cards by editable fields only", () => {
    const card = makeCard();
    expect(sameFields(card, toFields(makeCard({ version: 9, artworkUrl: "x" })))).toBe(true);
    expect(sameFields(card, { ...toFields(card), hp: 100 })).toBe(false);
  });
});

describe("drafts", () => {
  it("round-trips through localStorage", () => {
    drafts.set("kid1", "c1", newCardFields(), 3);
    expect(drafts.get("kid1", "c1")?.baseVersion).toBe(3);
    drafts.clear("kid1", "c1");
    expect(drafts.get("kid1", "c1")).toBeNull();
  });

  it("survives broken storage", () => {
    localStorage.setItem("pokemaker:draft:kid1:bad", "{not json");
    expect(drafts.get("kid1", "bad")).toBeNull();
  });
});
