import { describe, expect, it } from "vitest";
import { makeCard } from "../test/fixtures";
import { changeType, newCardFields, sameFields, toFields } from "./cardDefaults";
import { drafts } from "./drafts";
import { fitFontSize } from "./textFit";

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
