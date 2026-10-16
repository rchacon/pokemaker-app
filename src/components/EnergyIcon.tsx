import type { EnergyType } from "../types";
import { ENERGY } from "../lib/energy";

// Original glyphs drawn on a 24x24 grid, in white on a colored badge.
const GLYPHS: Record<EnergyType, React.ReactNode> = {
  grass: (
    <>
      <path d="M6 18c-1-7 4-12 12-13-1 8-5 13-12 13z" fill="#fff" />
      <path d="M6 18l7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  fire: <path d="M12 3c.6 3.2 4.8 5.2 4.8 10.2a4.8 4.8 0 0 1-9.6 0c0-2.6 1.6-3.6 1.9-6 1 1.5 1.9 2.4 2.9 2.6.3-2.2-.6-4.4 0-6.8z" fill="#fff" />,
  water: <path d="M12 3.5c2.8 4.4 5.6 7.3 5.6 10.8a5.6 5.6 0 0 1-11.2 0c0-3.5 2.8-6.4 5.6-10.8z" fill="#fff" />,
  lightning: <path d="M13.5 3 6.5 13.5h5L10 21l7.5-11h-5l1-7z" fill="#fff" />,
  psychic: (
    <>
      <path d="M3.5 12c2.4-4 5.3-6 8.5-6s6.1 2 8.5 6c-2.4 4-5.3 6-8.5 6s-6.1-2-8.5-6z" fill="#fff" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </>
  ),
  fighting: (
    <>
      <rect x="6" y="9" width="12" height="10" rx="3" fill="#fff" />
      <rect x="6" y="5.5" width="3" height="5" rx="1.5" fill="#fff" />
      <rect x="9.5" y="4.5" width="3" height="6" rx="1.5" fill="#fff" />
      <rect x="13" y="5" width="3" height="5.5" rx="1.5" fill="#fff" />
      <path d="M9 13.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  darkness: <path d="M15.5 4a8 8 0 1 0 4.8 12.6A6.5 6.5 0 0 1 15.5 4z" fill="#fff" />,
  metal: (
    <>
      <path d="M12 3.5 19.4 7.75v8.5L12 20.5l-7.4-4.25v-8.5z" fill="#fff" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </>
  ),
  dragon: (
    <>
      <path d="M7 19c0-6 2-11 6-15-1 4 0 6 2 7 0-2 1-3 2.5-3.5-.5 2 .5 4 .5 6 0 3.5-2.5 5.5-5.5 5.5z" fill="#fff" />
      <circle cx="13.5" cy="14" r="1.2" fill="currentColor" />
    </>
  ),
  colorless: <path d="M12 3c.9 4.6 2.7 6.4 9 9-6.3 2.6-8.1 4.4-9 9-.9-4.6-2.7-6.4-9-9 6.3-2.6 8.1-4.4 9-9z" fill="#fff" />,
};

interface Props {
  type: EnergyType;
  /** CSS size, e.g. "6cqw" on cards or "2rem" in the editor. */
  size?: string;
  title?: string;
  className?: string;
}

export function EnergyIcon({ type, size = "1.5rem", title, className }: Props) {
  const { color, label } = ENERGY[type];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={title ?? label}
      className={className}
      style={{ color, flexShrink: 0, display: "block" }}
    >
      <circle cx="12" cy="12" r="11.5" fill={color} />
      <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="1" />
      {GLYPHS[type]}
    </svg>
  );
}
