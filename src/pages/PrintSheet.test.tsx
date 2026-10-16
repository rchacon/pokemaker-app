import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeCard } from "../test/fixtures";
import { mockApi } from "../test/mockApi";
import { renderApp } from "../test/render";

const cards = Array.from({ length: 10 }, (_, i) =>
  makeCard({ cardId: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, name: `Card ${i}`, cardNumber: i + 1 }),
);

// Inline styles in real inches (jsdom would convert computed values to px).
const box = (el: HTMLElement) => [el.style.left, el.style.top, el.style.width, el.style.height];

describe("print sheet", () => {
  it("spaces cards ¼ inch apart for laminating by default, six per Letter page", async () => {
    mockApi({ "GET /api/profiles/:id/cards": () => cards });
    const { container } = renderApp("/p/kid1/print");
    const sheets = await screen.findAllByTestId("print-sheet");
    expect(sheets).toHaveLength(2);
    expect([sheets[0]!.style.width, sheets[0]!.style.height]).toEqual(["8.5in", "11in"]);
    expect(screen.getByRole("radio", { name: "¼ in" })).toHaveAttribute("aria-checked", "true");

    const slots = screen.getAllByTestId("print-slot");
    expect(slots).toHaveLength(10);
    expect(box(slots[0]!)).toEqual(["0.25in", "1.875in", "2.5in", "3.5in"]);
    expect(box(slots[1]!)).toEqual(["3in", "1.875in", "2.5in", "3.5in"]); // 2.5in card + 0.25in gap
    expect(box(slots[3]!)).toEqual(["0.25in", "5.625in", "2.5in", "3.5in"]);
    expect(box(slots[6]!)).toEqual(["0.25in", "1.875in", "2.5in", "3.5in"]); // second page

    // Cut lines run through the gaps; the card edges aren't outlined (cutting
    // there would break the lamination seal).
    expect(screen.getAllByTestId("cut-line").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".print-slot--guides")).toHaveLength(0);
    expect(screen.getByText(/keeps a ⅛-inch sealed edge/)).toBeInTheDocument();
  });

  it("can print edge to edge, nine per page, and remembers the choice", async () => {
    mockApi({ "GET /api/profiles/:id/cards": () => cards });
    const { user, container } = renderApp("/p/kid1/print");
    await screen.findAllByTestId("print-sheet");
    await user.click(screen.getByRole("radio", { name: "None" }));

    const slots = screen.getAllByTestId("print-slot");
    expect(box(slots[0]!)).toEqual(["0.5in", "0.25in", "2.5in", "3.5in"]);
    expect(box(slots[4]!)).toEqual(["3in", "3.75in", "2.5in", "3.5in"]);
    expect(screen.getAllByTestId("print-sheet")).toHaveLength(2); // 9 + 1
    expect(screen.queryAllByTestId("cut-line")).toHaveLength(0);
    expect(container.querySelectorAll(".print-slot--guides").length).toBe(10);
    expect(localStorage.getItem("pokemaker:printSpacing")).toBe("0");
  });

  it("prints only the requested cards and can hide cutting guides", async () => {
    mockApi({ "GET /api/profiles/:id/cards": () => cards });
    const { user, container } = renderApp(`/p/kid1/print?ids=${cards[3]!.cardId}`);
    expect(await screen.findAllByTestId("print-slot")).toHaveLength(1);
    expect(container.querySelectorAll(".crop-mark").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("checkbox", { name: "Cutting guides" }));
    expect(container.querySelectorAll(".crop-mark")).toHaveLength(0);
    expect(screen.queryAllByTestId("cut-line")).toHaveLength(0);
    await user.click(screen.getByRole("checkbox", { name: "Card 5" }));
    expect(screen.getAllByTestId("print-slot")).toHaveLength(2);
  });
});
