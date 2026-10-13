import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeCard } from "../test/fixtures";
import { mockApi } from "../test/mockApi";
import { renderApp } from "../test/render";

const cards = Array.from({ length: 10 }, (_, i) =>
  makeCard({ cardId: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, name: `Card ${i}`, cardNumber: i + 1 }),
);

describe("print sheet", () => {
  it("places cards at exactly 2.5 x 3.5 inches, nine per Letter page", async () => {
    mockApi({ "GET /api/profiles/:id/cards": () => cards });
    renderApp("/p/kid1/print");
    const sheets = await screen.findAllByTestId("print-sheet");
    expect(sheets).toHaveLength(2);
    // Inline styles in real inches (jsdom would convert computed values to px).
    expect([sheets[0]!.style.width, sheets[0]!.style.height]).toEqual(["8.5in", "11in"]);
    const slots = screen.getAllByTestId("print-slot");
    expect(slots).toHaveLength(10);
    const box = (el: HTMLElement) => [el.style.left, el.style.top, el.style.width, el.style.height];
    expect(box(slots[0]!)).toEqual(["0.5in", "0.25in", "2.5in", "3.5in"]);
    expect(box(slots[4]!)).toEqual(["3in", "3.75in", "2.5in", "3.5in"]);
  });

  it("prints only the requested cards and can hide cutting guides", async () => {
    mockApi({ "GET /api/profiles/:id/cards": () => cards });
    const { user, container } = renderApp(`/p/kid1/print?ids=${cards[3]!.cardId}`);
    expect(await screen.findAllByTestId("print-slot")).toHaveLength(1);
    expect(container.querySelectorAll(".crop-mark").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("checkbox", { name: "Cutting guides" }));
    expect(container.querySelectorAll(".crop-mark")).toHaveLength(0);
    await user.click(screen.getByRole("checkbox", { name: "Card 5" }));
    expect(screen.getAllByTestId("print-slot")).toHaveLength(2);
  });
});
