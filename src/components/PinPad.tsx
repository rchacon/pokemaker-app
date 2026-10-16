import { useEffect, useState } from "react";

export const PIN_LENGTH = 4;

interface Props {
  /** Called once all four digits are entered. */
  onComplete: (pin: string) => void;
  disabled?: boolean;
  /** Changing this clears the entered digits (e.g. after a wrong PIN). */
  resetKey?: number;
  shake?: boolean;
}

/** A big phone-style keypad: easy for small fingers, and works with a keyboard too. */
export function PinPad({ onComplete, disabled = false, resetKey = 0, shake = false }: Props) {
  const [digits, setDigits] = useState("");

  useEffect(() => setDigits(""), [resetKey]);

  const press = (digit: string) => {
    if (disabled || digits.length >= PIN_LENGTH) return;
    const next = digits + digit;
    setDigits(next);
    // Side effects stay out of state updaters (StrictMode runs those twice).
    if (next.length === PIN_LENGTH) setTimeout(() => onComplete(next), 120); // let the last dot show
  };
  const backspace = () => !disabled && setDigits((current) => current.slice(0, -1));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) press(event.key);
      else if (event.key === "Backspace") backspace();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className={`flex gap-3 ${shake ? "animate-[pm-shake_0.4s]" : ""}`}
        aria-label={`${digits.length} of ${PIN_LENGTH} digits entered`}
        role="status"
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={`size-5 rounded-full border-3 border-ink ${i < digits.length ? "bg-ink" : "bg-white"}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <Key key={d} label={d} onPress={() => press(d)} disabled={disabled} />
        ))}
        <span />
        <Key label="0" onPress={() => press("0")} disabled={disabled} />
        <button type="button" className="btn size-16 text-2xl" aria-label="Delete digit" onClick={backspace} disabled={disabled}>
          ⌫
        </button>
      </div>
    </div>
  );
}

function Key({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  return (
    <button type="button" className="btn size-16 font-display text-3xl" onClick={onPress} disabled={disabled} aria-label={`Digit ${label}`}>
      {label}
    </button>
  );
}
