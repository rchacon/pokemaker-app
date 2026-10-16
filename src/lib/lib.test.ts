import { describe, expect, it } from "vitest";
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
