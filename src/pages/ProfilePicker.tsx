import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Avatar } from "../components/Avatar";
import { Notice } from "../components/ui";
import { useProfiles } from "../hooks/useProfiles";
import { lastProfile } from "../lib/drafts";
import { unlocks } from "../lib/unlock";

export function ProfilePicker() {
  const { profiles, failed, retry } = useProfiles();
  const navigate = useNavigate();
  const last = lastProfile.get();

  // Switching player locks every profile again, so nobody inherits a sibling's unlock.
  useEffect(() => unlocks.clearAllExcept(), []);

  const choose = (profileId: string) => {
    lastProfile.set(profileId);
    navigate(`/p/${profileId}`);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight text-ink drop-shadow-[0_3px_0_#ffcb3d] sm:text-6xl">
          PokeMaker
        </h1>
        <p className="mt-3 font-display text-2xl font-medium">Who's making cards today?</p>
      </div>

      {failed && (
        <Notice tone="error">
          Can't reach PokeMaker right now.{" "}
          <button className="underline" onClick={retry}>
            Try again
          </button>
        </Notice>
      )}
      {!profiles && !failed && <p className="font-display text-xl">Loading…</p>}

      <div className="grid w-full gap-5 sm:grid-cols-2">
        {profiles?.map((profile) => (
          <button
            key={profile.profileId}
            className="panel flex flex-col items-center gap-3 p-8 transition hover:-translate-y-1 hover:bg-cream focus-visible:outline-4 focus-visible:outline-sky"
            onClick={() => choose(profile.profileId)}
          >
            <Avatar avatar={profile.avatar} size="6rem" />
            <span className="font-display text-3xl font-semibold">
              {profile.displayName}
              {profile.hasPin && (
                <span className="ml-2 text-2xl" title="Protected by a PIN" aria-label="(PIN protected)">
                  🔒
                </span>
              )}
            </span>
            {profile.profileId === last && (
              <span className="rounded-full bg-sun px-3 py-0.5 text-sm font-extrabold">Last played</span>
            )}
          </button>
        ))}
      </div>
    </main>
  );
}
