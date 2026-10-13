import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeCard } from "../test/fixtures";
import { PokemonCard } from "./PokemonCard";

describe("PokemonCard", () => {
  it("renders every part of the card from data", () => {
    render(<PokemonCard card={makeCard({ cardNumber: 7, resistance: "metal", retreatCost: 2 })} />);
    expect(screen.getByTestId("card-name")).toHaveTextContent("Layla");
    expect(screen.getByTestId("card-hp")).toHaveTextContent("90");
    expect(screen.getByText("Basic")).toBeInTheDocument();
    const attacks = screen.getAllByTestId("card-attack");
    expect(attacks).toHaveLength(2);
    expect(within(attacks[0]!).getByText("Jump")).toBeInTheDocument();
    expect(within(attacks[1]!).getByText("60")).toBeInTheDocument();
    expect(within(attacks[1]!).getAllByRole("img", { name: "Colorless" })).toHaveLength(2);
    expect(screen.getByText("×2")).toBeInTheDocument();
    expect(screen.getByText("-30")).toBeInTheDocument();
    expect(screen.getByText("#007")).toBeInTheDocument();
    expect(screen.getByTestId("card-flavor")).toHaveTextContent("She jumps higher than the couch.");
  });

  it("shows artwork when present and a placeholder otherwise", () => {
    const { rerender } = render(<PokemonCard card={makeCard()} showArtHint />);
    expect(screen.queryByRole("img", { name: /artwork of/i })).not.toBeInTheDocument();
    expect(screen.getByText("Your creature appears here!")).toBeInTheDocument();
    rerender(<PokemonCard card={makeCard({ artworkUrl: "https://example.test/a.webp" })} />);
    const img = screen.getByRole("img", { name: "Artwork of Layla" });
    expect(img).toHaveAttribute("src", "https://example.test/a.webp");
    expect(img).toHaveAttribute("crossorigin", "anonymous"); // needed for PNG/PDF export
  });

  it("shows evolution info for evolved stages only", () => {
    render(<PokemonCard card={makeCard({ stage: "stage1", evolvesFrom: "Puppla" })} />);
    expect(screen.getByText("Stage 1")).toBeInTheDocument();
    expect(screen.getByText("Evolves from Puppla")).toBeInTheDocument();
  });

  it("shrinks long names and clamps long attack text", () => {
    const longName = "Thunderwhiskerpaws";
    const longEffect = "Flip a coin. ".repeat(10);
    render(
      <PokemonCard
        card={makeCard({
          name: longName,
          attacks: [{ name: "Mega Super Ultra Thunder Bolt", damage: 120, cost: ["lightning"], effect: longEffect }],
        })}
      />,
    );
    const name = screen.getByTestId("card-name");
    expect(name).toHaveTextContent(longName);
    expect(parseFloat(name.style.fontSize)).toBeLessThan(7.4);
    const effect = screen.getByTestId("card-attack-effect");
    expect(effect.style.webkitLineClamp).toBe("4"); // one attack gets more lines
  });

  it("gives each attack fewer lines when there are two", () => {
    const effect = "Something long happens. ".repeat(5);
    render(
      <PokemonCard
        card={makeCard({
          attacks: [
            { name: "A", damage: 10, cost: [], effect },
            { name: "B", damage: 20, cost: [], effect },
          ],
        })}
      />,
    );
    for (const el of screen.getAllByTestId("card-attack-effect")) expect(el.style.webkitLineClamp).toBe("2");
  });

  it("falls back gracefully for an empty card", () => {
    render(<PokemonCard card={makeCard({ name: "", attacks: [], flavorText: "" })} />);
    expect(screen.getByTestId("card-name")).toHaveTextContent("???");
    expect(screen.getByText("No attacks yet")).toBeInTheDocument();
    expect(screen.queryByTestId("card-flavor")).not.toBeInTheDocument();
  });
});
