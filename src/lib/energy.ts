import type { EnergyType, Stage } from "../types";

interface EnergyStyle {
  label: string;
  /** Icon badge color. */
  color: string;
  /** Card panel gradient (top → bottom). */
  panel: [string, string];
  /** Readable text color on the panel. */
  ink: string;
}

export const ENERGY: Record<EnergyType, EnergyStyle> = {
  grass: { label: "Grass", color: "#4caf50", panel: ["#e6f6d5", "#a8d98a"], ink: "#1d3a12" },
  fire: { label: "Fire", color: "#f0592b", panel: ["#ffe2c9", "#f7a072"], ink: "#4a1606" },
  water: { label: "Water", color: "#2f8fe0", panel: ["#dcefff", "#8cc4f2"], ink: "#0c2c4f" },
  lightning: { label: "Lightning", color: "#f2bf16", panel: ["#fff6c4", "#f6dc63"], ink: "#4a3b00" },
  psychic: { label: "Psychic", color: "#a755d1", panel: ["#f3e3fb", "#cf9be8"], ink: "#3b1150" },
  fighting: { label: "Fighting", color: "#c06a2b", panel: ["#f6e2cf", "#d9a273"], ink: "#45220a" },
  darkness: { label: "Darkness", color: "#3d4766", panel: ["#c9cfdf", "#7c86a3"], ink: "#11162a" },
  metal: { label: "Metal", color: "#8a96a3", panel: ["#eef1f4", "#bcc5cf"], ink: "#22292f" },
  dragon: { label: "Dragon", color: "#7556d6", panel: ["#f6edc8", "#c9b4f0"], ink: "#2c1b5e" },
  colorless: { label: "Colorless", color: "#b8b0a0", panel: ["#fbf8f1", "#ddd6c6"], ink: "#38332a" },
};

export const STAGE_LABELS: Record<Stage, string> = {
  basic: "Basic",
  stage1: "Stage 1",
  stage2: "Stage 2",
};
