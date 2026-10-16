const AVATARS: Record<string, string> = {
  dragon: "🐉",
  lightning: "⚡",
  rocket: "🚀",
  star: "⭐",
  fire: "🔥",
  water: "🌊",
  leaf: "🍃",
  paw: "🐾",
};

export function Avatar({ avatar, size = "3rem" }: { avatar: string; size?: string }) {
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full border-3 border-ink bg-sun"
      style={{ width: size, height: size, fontSize: `calc(${size} * 0.55)` }}
    >
      {AVATARS[avatar] ?? "⭐"}
    </span>
  );
}
