import { useState } from "react";
import { ApiError, api } from "../lib/api";
import { unlocks } from "../lib/unlock";
import type { Profile } from "../types";
import { Avatar } from "./Avatar";
import { PinPad } from "./PinPad";

interface Props {
  profile: Profile;
  /** "unlock": enter an existing PIN. "set": choose a new PIN (twice). */
  mode: "unlock" | "set";
  onDone: (success: boolean) => void;
}

export function PinDialog({ profile, mode, onDone }: Props) {
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [firstPin, setFirstPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const name = profile.displayName;

  const retry = (text: string) => {
    setMessage(text);
    setResetKey((k) => k + 1);
  };

  const unlock = async (pin: string) => {
    setBusy(true);
    try {
      unlocks.set(await api.unlock(profile.profileId, pin));
      onDone(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === "WRONG_PIN") {
        const left = error.details.attemptsLeft as number;
        retry(`Not quite! ${left} ${left === 1 ? "try" : "tries"} left.`);
      } else if (error instanceof ApiError && error.code === "PROFILE_LOCKED") {
        const minutes = Math.ceil((error.details.retryAfterSeconds as number) / 60);
        setLocked(true);
        retry(`Too many tries. Take a break and try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
      } else {
        retry(error instanceof ApiError ? error.message : "Something went wrong. Try again!");
      }
    } finally {
      setBusy(false);
    }
  };

  const choose = async (pin: string) => {
    if (step === "enter") {
      setFirstPin(pin);
      setStep("confirm");
      setMessage(null);
      setResetKey((k) => k + 1);
      return;
    }
    if (pin !== firstPin) {
      setStep("enter");
      retry("Those didn't match. Let's start again!");
      return;
    }
    setBusy(true);
    try {
      unlocks.set(await api.setPin(profile.profileId, pin));
      onDone(true);
    } catch (error) {
      setStep("enter");
      retry(error instanceof ApiError ? error.message : "Couldn't save the PIN. Try again!");
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "unlock"
      ? `${name}'s cards are locked`
      : step === "enter"
        ? `Choose a secret PIN for ${name}`
        : "Type it one more time";
  const hint =
    mode === "unlock"
      ? `Enter ${name}'s PIN. Grown-ups can use their own PIN.`
      : "Pick 4 numbers you'll remember. Don't tell your brother or sister!";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/60 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="pin-title" className="panel flex w-full max-w-sm flex-col items-center gap-4 p-6 text-center">
        <Avatar avatar={profile.avatar} size="4rem" />
        <h2 id="pin-title" className="font-display text-2xl font-semibold">
          {mode === "unlock" ? "🔒 " : "🔐 "}
          {title}
        </h2>
        <p className="font-semibold text-ink-soft">{hint}</p>
        <PinPad
          onComplete={(pin) => void (mode === "unlock" ? unlock(pin) : choose(pin))}
          disabled={busy || locked}
          resetKey={resetKey}
          shake={message !== null}
        />
        {message && (
          <p role="alert" className="font-bold text-berry-dark">
            {message}
          </p>
        )}
        <button type="button" className="btn btn-sm" onClick={() => onDone(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
