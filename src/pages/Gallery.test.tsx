import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeCard, PROFILES } from "../test/fixtures";
import { mockApi, reply } from "../test/mockApi";
import { renderApp } from "../test/render";

const LAYLA = makeCard();
const SPARK = makeCard({ cardId: "22222222-2222-4222-8222-222222222222", name: "Sparkpup", cardNumber: 2 });

describe("gallery", () => {
  it("shows the child's own collection", async () => {
    const api = mockApi({ "GET /api/profiles": () => PROFILES, "GET /api/profiles/:id/cards": () => [LAYLA, SPARK] });
    renderApp("/p/kid1");
    const list = await screen.findByRole("list", { name: "Card collection" });
    expect(await within(list).findAllByTestId("pokemon-card")).toHaveLength(2);
    expect(within(list).getByRole("link", { name: "Edit Sparkpup" })).toHaveAttribute("href", `/p/kid1/cards/${SPARK.cardId}`);
    expect(api.callsTo("GET", "/profiles/kid1/cards")).toHaveLength(1);
    expect(api.callsTo("GET", "/profiles/kid2/cards")).toHaveLength(0);
  });

  it("has a friendly empty state", async () => {
    mockApi({ "GET /api/profiles": () => PROFILES, "GET /api/profiles/:id/cards": () => [] });
    renderApp("/p/kid1");
    expect(await screen.findByText("No cards yet!")).toBeInTheDocument();
  });

  it("deletes a card only after confirmation", async () => {
    const api = mockApi({
      "GET /api/profiles": () => PROFILES,
      "GET /api/profiles/:id/cards": () => [LAYLA, SPARK],
      "DELETE /api/profiles/:id/cards/:cardId": () => reply(204),
    });
    const { user } = renderApp("/p/kid1");
    await user.click(await screen.findByRole("button", { name: "Delete Sparkpup" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Keep it" }));
    expect(api.callsTo("DELETE", "/cards/")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Delete Sparkpup" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete it" }));
    expect(api.callsTo("DELETE", `/cards/${SPARK.cardId}`)).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "Edit Sparkpup" })).not.toBeInTheDocument();
  });

  it("duplicates a card", async () => {
    const copy = makeCard({ cardId: "33333333-3333-4333-8333-333333333333", name: "Layla Copy", cardNumber: 3 });
    const api = mockApi({
      "GET /api/profiles": () => PROFILES,
      "GET /api/profiles/:id/cards": () => [LAYLA],
      "POST /api/profiles/:id/cards/:cardId/duplicate": () => reply(201, copy),
    });
    const { user } = renderApp("/p/kid1");
    await user.click(await screen.findByRole("button", { name: "Copy Layla" }));
    expect(await screen.findByRole("link", { name: "Edit Layla Copy" })).toBeInTheDocument();
    expect(api.callsTo("POST", "/duplicate")).toHaveLength(1);
  });
});
