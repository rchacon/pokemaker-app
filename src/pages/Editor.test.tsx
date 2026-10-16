import { act, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CardFields } from "../types";
import { makeCard, PROFILES } from "../test/fixtures";
import { apiError, mockApi, reply, type MockRequest } from "../test/mockApi";
import { renderApp } from "../test/render";

const CARD = makeCard();
const EDIT_URL = `/p/kid1/cards/${CARD.cardId}`;

function editorApi(overrides: Parameters<typeof mockApi>[0] = {}) {
  let stored = CARD;
  return mockApi({
    "GET /api/profiles": () => PROFILES,
    "GET /api/profiles/:id/cards": () => [stored],
    "GET /api/profiles/:id/cards/:cardId": () => stored,
    "PUT /api/profiles/:id/cards/:cardId": (req: MockRequest) => {
      const body = req.body as CardFields & { version: number };
      stored = { ...stored, ...body, version: body.version + 1 };
      return stored;
    },
    ...overrides,
  });
}

const preview = () => within(screen.getByRole("complementary", { name: "Card preview" }));

describe("card editor", () => {
  it("updates the live preview instantly without calling the server", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const api = editorApi();
    const { user } = renderApp(EDIT_URL, { advanceTimers: vi.advanceTimersByTime });
    const name = await screen.findByLabelText("Creature name");
    const before = api.calls.length;

    await user.clear(name);
    await user.type(name, "Sir Fluff");
    expect(preview().getByTestId("card-name")).toHaveTextContent("Sir Fluff");

    await user.click(screen.getByRole("button", { name: "More HP" }));
    expect(preview().getByTestId("card-hp")).toHaveTextContent("100");

    await user.click(within(screen.getByRole("radiogroup", { name: "Type" })).getByRole("radio", { name: "Fire" }));
    expect(preview().getByText(/Fire-type creature/)).toBeInTheDocument();

    expect(api.calls.length).toBe(before); // nothing sent while typing
  });

  it("adds, edits and removes attacks (two at most)", async () => {
    editorApi();
    const { user } = renderApp(EDIT_URL);
    await screen.findByLabelText("Creature name");
    expect(screen.queryByRole("button", { name: /Add an attack/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Attack 2" }));
    expect(preview().getAllByTestId("card-attack")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /Add an attack/ }));
    const name = screen.getByLabelText("Attack name", { selector: "#attack-1-name" });
    await user.type(name, "Tail Spin");
    expect(preview().getByText("Tail Spin")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add an attack/ })).not.toBeInTheDocument();
  });

  it("picks energy costs with icons, up to four", async () => {
    editorApi();
    const { user } = renderApp(EDIT_URL);
    const attack = within(await screen.findByRole("group", { name: "Attack 1" }));
    const cost = attack.getByTestId("energy-cost");
    expect(within(cost).getAllByRole("button")).toHaveLength(1);

    await user.click(attack.getByRole("button", { name: "Add Water energy" }));
    await user.click(attack.getByRole("button", { name: "Add Fire energy" }));
    await user.click(attack.getByRole("button", { name: "Add Fire energy" }));
    expect(within(cost).getAllByRole("button")).toHaveLength(4);
    expect(attack.getByRole("button", { name: "Add Grass energy" })).toBeDisabled();

    await user.click(within(cost).getByRole("button", { name: "Remove Water energy" }));
    expect(within(cost).getAllByRole("button")).toHaveLength(3);
    const firstAttack = preview().getAllByTestId("card-attack")[0]!;
    expect(within(firstAttack).getAllByRole("img", { name: "Fire" })).toHaveLength(2);
  });

  it("autosaves once after the child stops typing, with the card's version", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const api = editorApi();
    const { user } = renderApp(EDIT_URL, { advanceTimers: vi.advanceTimersByTime });
    const name = await screen.findByLabelText("Creature name");
    expect(screen.getByRole("status", { name: "" })).toBeDefined();

    await user.type(name, "!!!");
    expect(screen.getByText("Saving soon…")).toBeInTheDocument();
    expect(api.callsTo("PUT", "/cards/")).toHaveLength(0);
    // The draft is protected locally right away.
    expect(localStorage.getItem(`pokemaker:draft:kid1:${CARD.cardId}`)).toContain("Layla!!!");

    await act(() => vi.advanceTimersByTimeAsync(1100));
    await waitFor(() => expect(screen.getByText("✓ Saved")).toBeInTheDocument());
    const puts = api.callsTo("PUT", "/cards/");
    expect(puts).toHaveLength(1);
    expect(puts[0]!.body).toMatchObject({ name: "Layla!!!", version: 1 });
    expect(localStorage.getItem(`pokemaker:draft:kid1:${CARD.cardId}`)).toBeNull();

    // The next save is based on the new version.
    await user.type(name, "?");
    await act(() => vi.advanceTimersByTimeAsync(1100));
    await waitFor(() => expect(api.callsTo("PUT", "/cards/")).toHaveLength(2));
    expect(api.callsTo("PUT", "/cards/")[1]!.body).toMatchObject({ version: 2 });
  });

  it("asks what to keep instead of overwriting a newer save", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const newer = makeCard({ name: "Layla (tablet)", version: 5 });
    const api = editorApi({
      "PUT /api/profiles/:id/cards/:cardId": (req: MockRequest) =>
        (req.body as { version: number }).version === 5
          ? { ...newer, ...(req.body as object), version: 6 }
          : apiError(409, "VERSION_CONFLICT", "changed", { current: newer }),
    });
    const { user } = renderApp(EDIT_URL, { advanceTimers: vi.advanceTimersByTime });
    await user.type(await screen.findByLabelText("Creature name"), " mine");
    await act(() => vi.advanceTimersByTimeAsync(1100));

    expect(await screen.findByText(/changed somewhere else/)).toBeInTheDocument();
    expect(screen.getByText("Needs a choice")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keep mine" }));
    await waitFor(() => expect(screen.getByText("✓ Saved")).toBeInTheDocument());
    const puts = api.callsTo("PUT", "/cards/");
    expect(puts.at(-1)!.body).toMatchObject({ name: "Layla mine", version: 5 });
  });

  it("restores unsaved edits from this device", async () => {
    localStorage.setItem(
      `pokemaker:draft:kid1:${CARD.cardId}`,
      JSON.stringify({ fields: { ...CARD, name: "Unsaved Layla" }, baseVersion: 1, savedAt: "x" }),
    );
    editorApi();
    renderApp(EDIT_URL);
    expect(await screen.findByDisplayValue("Unsaved Layla")).toBeInTheDocument();
  });

  it("keeps a brand-new card as a local draft until it's saved", async () => {
    const created = makeCard({ cardId: "44444444-4444-4444-8444-444444444444", name: "Zappy", cardNumber: 9 });
    const api = editorApi({ "POST /api/profiles/:id/cards": () => reply(201, created) });
    const { user } = renderApp("/p/kid1/cards/new");
    await user.type(await screen.findByLabelText("Creature name"), "Zappy");
    expect(JSON.parse(localStorage.getItem("pokemaker:draft:kid1:new")!).fields.name).toBe("Zappy");
    expect(api.callsTo("POST", "/cards")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /Save card/ }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(`/p/kid1/cards/${created.cardId}`));
    expect(api.callsTo("POST", "/cards")[0]!.body).toMatchObject({ name: "Zappy" });
    expect(localStorage.getItem("pokemaker:draft:kid1:new")).toBeNull();
  });
});
