import { act, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Profile, UnlockResponse } from "../types";
import { makeCard, PROFILES } from "../test/fixtures";
import { apiError, mockApi, reply, type MockRequest } from "../test/mockApi";
import { renderApp } from "../test/render";

const CARD = makeCard();
const LOCKED: Profile[] = PROFILES.map((p) => (p.profileId === "kid1" ? { ...p, hasPin: true } : p));
const TOKEN: UnlockResponse = {
  profileId: "kid1",
  token: "v1.token.sig",
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  byParent: false,
};

function pinApi(overrides: Parameters<typeof mockApi>[0] = {}) {
  return mockApi({
    "GET /api/profiles": () => LOCKED,
    "GET /api/profiles/:id/cards": () => [CARD],
    "GET /api/profiles/:id/cards/:cardId": () => CARD,
    "GET /api/artwork/quota": () => ({ date: "x", used: 0, limit: 10, remaining: 10, resetsAt: "2026-10-14T00:00:00Z" }),
    "POST /api/profiles/:id/unlock": (req: MockRequest) =>
      (req.body as { pin: string }).pin === "1234" ? TOKEN : apiError(401, "WRONG_PIN", "nope", { attemptsLeft: 4 }),
    ...overrides,
  });
}

const dialog = () => within(screen.getByRole("dialog"));

async function typePin(user: ReturnType<typeof renderApp>["user"], pin: string) {
  for (const digit of pin) await user.click(dialog().getByRole("button", { name: `Digit ${digit}` }));
}

describe("profile PINs", () => {
  it("lets anyone look at a locked collection", async () => {
    pinApi();
    renderApp("/p/kid1");
    expect(await screen.findByText(/Locked · look but don't touch/)).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Edit Layla" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks for the PIN before deleting, then sends the unlock token", async () => {
    const api = pinApi({ "DELETE /api/profiles/:id/cards/:cardId": () => reply(204) });
    const { user } = renderApp("/p/kid1");
    await user.click(await screen.findByRole("button", { name: "Delete Layla" }));
    expect(dialog().getByText("Enter Trainer 1's PIN. Grown-ups can use their own PIN.")).toBeInTheDocument();

    await typePin(user, "9999");
    expect(await screen.findByText("Not quite! 4 tries left.")).toBeInTheDocument();
    await typePin(user, "1234");
    await user.click(await screen.findByRole("button", { name: "Delete it" }));

    await waitFor(() => expect(api.callsTo("DELETE", "/cards/")).toHaveLength(1));
    expect(api.callsTo("DELETE", "/cards/")[0]!.headers.Authorization).toBe("Bearer v1.token.sig");
    expect(screen.getByText("🔓 Unlocked")).toBeInTheDocument();

    // Locking again updates the bar right away.
    await user.click(screen.getByRole("button", { name: "🔒 Lock" }));
    expect(screen.getByText(/Locked · look but don't touch/)).toBeInTheDocument();
  });

  it("cancelling the PIN changes nothing", async () => {
    const api = pinApi();
    const { user } = renderApp("/p/kid1");
    await user.click(await screen.findByRole("button", { name: "Copy Layla" }));
    await user.click(dialog().getByRole("button", { name: "Cancel" }));
    expect(api.callsTo("POST", "/duplicate")).toHaveLength(0);
  });

  it("opens the editor only after the PIN, and cancelling goes back to the gallery", async () => {
    pinApi();
    const { user } = renderApp(`/p/kid1/cards/${CARD.cardId}`);
    expect(await screen.findByText("🔒 Waiting for the PIN…")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/p\/kid1$/));
  });

  it("autosaves with the token, and asks again if the unlock expired", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let expired = true;
    const api = pinApi({
      "PUT /api/profiles/:id/cards/:cardId": (req: MockRequest) =>
        expired ? apiError(401, "PIN_REQUIRED", "Enter the PIN") : { ...CARD, ...(req.body as object), version: 2 },
    });
    const { user } = renderApp(`/p/kid1/cards/${CARD.cardId}`, { advanceTimers: vi.advanceTimersByTime });
    await screen.findByRole("dialog");
    await typePin(user, "1234");
    await user.type(await screen.findByLabelText("Creature name"), "!");
    await act(() => vi.advanceTimersByTimeAsync(1100));

    // The token was rejected (say, a parent changed the PIN): the editor asks again.
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("🔒 Needs the PIN to save")).toBeInTheDocument();
    expired = false;
    await typePin(user, "1234");
    await waitFor(() => expect(screen.getByText("✓ Saved")).toBeInTheDocument());
    const puts = api.callsTo("PUT", "/cards/");
    expect(puts.at(-1)!.body).toMatchObject({ name: "Layla!" });
    expect(puts.at(-1)!.headers.Authorization).toBe("Bearer v1.token.sig");
  });

  it("explains when too many wrong PINs locked the profile", async () => {
    pinApi({
      "POST /api/profiles/:id/unlock": () => apiError(423, "PROFILE_LOCKED", "Too many", { retryAfterSeconds: 240 }),
    });
    const { user } = renderApp("/p/kid1");
    await user.click(await screen.findByRole("button", { name: "Unlock" }));
    await typePin(user, "0000");
    expect(await screen.findByText("Too many tries. Take a break and try again in 4 minutes.")).toBeInTheDocument();
    expect(dialog().getByRole("button", { name: "Digit 1" })).toBeDisabled();
  });

  it("lets a player choose a PIN, typed twice", async () => {
    let hasPin = false;
    const api = mockApi({
      "GET /api/profiles": () => PROFILES.map((p) => (p.profileId === "kid2" ? { ...p, hasPin } : p)),
      "GET /api/profiles/:id/cards": () => [],
      "PUT /api/profiles/:id/pin": () => {
        hasPin = true;
        return { ...TOKEN, profileId: "kid2" };
      },
    });
    const { user } = renderApp("/p/kid2");
    await user.click(await screen.findByRole("button", { name: /Add a PIN/ }));
    await typePin(user, "4321");
    expect(await screen.findByText(/Type it one more time/)).toBeInTheDocument();
    await typePin(user, "4320");
    expect(await screen.findByText("Those didn't match. Let's start again!")).toBeInTheDocument();
    await typePin(user, "4321");
    await screen.findByText(/Type it one more time/);
    await typePin(user, "4321");

    expect(await screen.findByText("🔓 Unlocked")).toBeInTheDocument();
    expect(api.callsTo("PUT", "/pin")).toHaveLength(1);
    expect(api.callsTo("PUT", "/pin")[0]!.body).toEqual({ pin: "4321" });
  });

  it("switching player locks everything again", async () => {
    sessionStorage.setItem("pokemaker:unlock", JSON.stringify({ kid1: { token: "t", expiresAt: TOKEN.expiresAt } }));
    pinApi();
    renderApp("/players");
    await screen.findByText("Who's making cards today?");
    expect(JSON.parse(sessionStorage.getItem("pokemaker:unlock")!)).toEqual({});
    expect(screen.getByLabelText("(PIN protected)")).toBeInTheDocument();
  });
});
