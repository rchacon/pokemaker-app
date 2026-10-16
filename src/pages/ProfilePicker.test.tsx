import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PROFILES } from "../test/fixtures";
import { mockApi } from "../test/mockApi";
import { renderApp } from "../test/render";

describe("profile selection", () => {
  it("lets a child pick their profile and remembers it", async () => {
    mockApi({ "GET /api/profiles": () => PROFILES, "GET /api/profiles/:id/cards": () => [] });
    const { user } = renderApp("/");
    await user.click(await screen.findByRole("button", { name: /Trainer 2/ }));
    expect(screen.getByTestId("location")).toHaveTextContent("/p/kid2");
    expect(await screen.findByRole("heading", { name: "Trainer 2's cards" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("pokemaker:lastProfile")!)).toBe("kid2");
  });

  it("goes straight to the last profile on the next visit", async () => {
    localStorage.setItem("pokemaker:lastProfile", JSON.stringify("kid1"));
    mockApi({ "GET /api/profiles": () => PROFILES, "GET /api/profiles/:id/cards": () => [] });
    renderApp("/");
    expect(await screen.findByRole("heading", { name: "Trainer 1's cards" })).toBeInTheDocument();
  });

  it("returns to the picker if the remembered profile no longer exists", async () => {
    localStorage.setItem("pokemaker:lastProfile", JSON.stringify("ghost"));
    mockApi({ "GET /api/profiles": () => PROFILES, "GET /api/profiles/:id/cards": () => [] });
    renderApp("/");
    expect(await screen.findByText("Who's making cards today?")).toBeInTheDocument();
    expect(localStorage.getItem("pokemaker:lastProfile")).toBeNull();
  });

  it("explains when the server can't be reached", async () => {
    mockApi({ "GET /api/profiles": () => { throw new TypeError("offline"); } });
    renderApp("/players");
    expect(await screen.findByText(/Can't reach PokeMaker/)).toBeInTheDocument();
  });
});
