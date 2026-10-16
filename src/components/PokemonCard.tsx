import type { CSSProperties } from "react";
import { ENERGY, STAGE_LABELS } from "../lib/energy";
import { cqw, fitFontSize } from "../lib/textFit";
import type { CardView } from "../types";
import { EnergyIcon } from "./EnergyIcon";
import "./PokemonCard.css";

interface Props {
  card: CardView;
  /** Overlay shown on the artwork while new art is being drawn. */
  generating?: boolean;
  /** Show the "your art goes here" hint in the empty art frame (editor only). */
  showArtHint?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * The trading card, drawn entirely with HTML/CSS/SVG from card data. Only the
 * creature picture is AI-generated; every word, number, icon and border comes
 * from here — so editing text never needs new artwork, and the same component
 * renders the live preview and the gallery.
 *
 * All sizes are in cqw (1% of the card's width), so the card scales perfectly
 * to any width while keeping its 5:7 (2.5 x 3.5 in) proportions.
 */
export function PokemonCard({ card, generating = false, showArtHint = false, className = "", style }: Props) {
  const energy = ENERGY[card.type];
  const name = card.name.trim() || "???";
  const attacks = card.attacks.slice(0, 2);
  const effectLines = attacks.length > 1 ? 2 : 4;
  const evolves = card.stage !== "basic" && card.evolvesFrom;

  return (
    <article
      className={`pm-card ${className}`}
      style={style}
      aria-label={`${name} card`}
      data-testid="pokemon-card"
    >
      <div
        className="pm-card__frame"
        style={
          {
            "--panel-top": energy.panel[0],
            "--panel-bottom": energy.panel[1],
            "--ink": energy.ink,
            "--accent": energy.color,
          } as CSSProperties
        }
      >
        <header className="pm-card__header">
          <div className="pm-card__stage-row">
            <span className="pm-card__stage">{STAGE_LABELS[card.stage]}</span>
            {evolves && <span className="pm-card__evolves">Evolves from {card.evolvesFrom}</span>}
          </div>
          <div className="pm-card__title-row">
            <h2
              className="pm-card__name"
              data-testid="card-name"
              style={{ fontSize: cqw(fitFontSize(name, 7.4, 11, 4.2)) }}
            >
              {name}
            </h2>
            <span className="pm-card__hp">
              <small>HP</small>
              <span data-testid="card-hp">{card.hp}</span>
            </span>
            <EnergyIcon type={card.type} size={cqw(7.5)} />
          </div>
        </header>

        <div className="pm-card__art">
          {card.artworkUrl ? (
            <img src={card.artworkUrl} alt={`Artwork of ${name}`} crossOrigin="anonymous" draggable={false} />
          ) : (
            <div className="pm-card__art-placeholder" aria-hidden={!showArtHint}>
              <EnergyIcon type={card.type} size={cqw(22)} className="pm-card__art-placeholder-icon" />
              {showArtHint && <span>Your creature appears here!</span>}
            </div>
          )}
          {generating && (
            <div className="pm-card__art-busy" role="status">
              <span className="pm-card__spinner" />
              Drawing…
            </div>
          )}
        </div>

        <div className="pm-card__strip">
          {energy.label}-type creature
          {card.cardNumber ? ` · No. ${String(card.cardNumber).padStart(3, "0")}` : ""}
        </div>

        <section className="pm-card__attacks" aria-label="Attacks">
          {attacks.length === 0 && <p className="pm-card__no-attacks">No attacks yet</p>}
          {attacks.map((attack, index) => (
            <div className="pm-card__attack" key={index} data-testid="card-attack">
              <div className="pm-card__attack-row">
                <span className="pm-card__cost">
                  {attack.cost.length === 0 ? (
                    <span className="pm-card__cost-free" />
                  ) : (
                    attack.cost.map((type, i) => <EnergyIcon key={i} type={type} size={cqw(5.4)} />)
                  )}
                </span>
                <span
                  className="pm-card__attack-name"
                  style={{ fontSize: cqw(fitFontSize(attack.name || "Attack", 5.4, 13, 3.6)) }}
                >
                  {attack.name || "Attack"}
                </span>
                <span className="pm-card__damage">{attack.damage > 0 ? attack.damage : ""}</span>
              </div>
              {attack.effect && (
                <p
                  className="pm-card__effect"
                  data-testid="card-attack-effect"
                  style={{ WebkitLineClamp: effectLines }}
                >
                  {attack.effect}
                </p>
              )}
            </div>
          ))}
        </section>

        <footer className="pm-card__footer">
          <div className="pm-card__stats">
            <Stat label="weakness">
              {card.weakness ? (
                <>
                  <EnergyIcon type={card.weakness} size={cqw(4.6)} />
                  <b>×2</b>
                </>
              ) : (
                <b>–</b>
              )}
            </Stat>
            <Stat label="resistance">
              {card.resistance ? (
                <>
                  <EnergyIcon type={card.resistance} size={cqw(4.6)} />
                  <b>-30</b>
                </>
              ) : (
                <b>–</b>
              )}
            </Stat>
            <Stat label="retreat">
              {card.retreatCost === 0 ? (
                <b>–</b>
              ) : (
                Array.from({ length: card.retreatCost }, (_, i) => (
                  <EnergyIcon key={i} type="colorless" size={cqw(4.6)} />
                ))
              )}
            </Stat>
          </div>
          {card.flavorText && (
            <p className="pm-card__flavor" data-testid="card-flavor">
              {card.flavorText}
            </p>
          )}
          <div className="pm-card__credits">
            <span>PokeMaker</span>
            <span>{card.cardNumber ? `#${String(card.cardNumber).padStart(3, "0")}` : "New!"}</span>
          </div>
        </footer>
      </div>
    </article>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pm-card__stat">
      <span className="pm-card__stat-label">{label}</span>
      <span className="pm-card__stat-value">{children}</span>
    </div>
  );
}
