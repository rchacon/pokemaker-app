# pokemaker-app

The React frontend for **PokeMaker**: kids design their own trading cards, see a
live preview as they type, add AI artwork, and print real 2.5 × 3.5-inch cards.

React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router, tested with Vitest and
React Testing Library. Sibling repositories: [`pokemaker-api`](../pokemaker-api)
(FastAPI backend) and [`pokemaker-infra`](../pokemaker-infra) (Terraform).

## Run it locally

The backend must be running first. See `../pokemaker-api/README.md`, which comes
down to `docker compose up -d`, `python scripts/init_local.py`, then
`uvicorn src.main:app --reload`.

```bash
npm install
npm run dev          # http://localhost:5173 (proxies /api to http://localhost:8000)
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm test` | Vitest + React Testing Library (jsdom) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Type-check and build to `dist/` |
| `./scripts/deploy.sh` | Build and publish to the S3/CloudFront site from `pokemaker-infra` |

## How it fits together

```text
src/
├── App.tsx                    Routes
├── pages/
│   ├── ProfilePicker.tsx      "Who's making cards today?"
│   ├── Gallery.tsx            One child's collection: edit, copy, picture, print, delete
│   ├── Editor.tsx             Form + live preview + artwork; autosave status
│   └── PrintSheet.tsx         Letter sheets, 9 cards each, crop marks, Print / PDF
├── components/
│   ├── PokemonCard.tsx/.css   The card itself (used everywhere, incl. exports)
│   ├── EnergyIcon.tsx         Original SVG type icons
│   └── editor/                Type picker, steppers, attack + energy-cost editors
├── hooks/
│   ├── useCardEditor.ts       Load, local drafts, debounced autosave, conflicts
│   ├── useArtworkGeneration.ts  Idempotent generate + polling
│   └── useQuota.ts, useProfiles.ts
└── lib/
    ├── api.ts                 Typed fetch client; structured ApiError
    ├── drafts.ts              localStorage: drafts, last profile, pending generation
    └── export/                Print geometry, PNG (300 DPI) and PDF exports
```

### One card renderer for everything

`PokemonCard` draws the whole card (name, HP, icons, attacks, weakness, borders)
with HTML, CSS and SVG from card data. Only the creature picture comes from the
AI, so changing text never needs new artwork. Every size inside the card uses
`cqw` (container-query width units), so the same markup renders:

- the live preview, which updates on every keystroke with no server calls,
- gallery thumbnails,
- printed sheets at exactly 2.5 × 3.5 in,
- PNG and PDF exports.

Long names shrink smoothly (`lib/textFit.ts`) and long attack or flavor text is
clamped, so the layout never breaks.

### Saving

- Every edit is written to `localStorage` immediately, so a closed tab or dead
  battery doesn't lose work.
- Saved cards autosave 1 s after the last change. Saves never overlap.
- Each save sends the card's `version`. If another device saved first, the API
  returns `409` and the editor asks "Keep mine" or "Use the other one" instead of
  overwriting silently.
- New cards stay a local draft until **Save card** is pressed. Pressing **Generate
  artwork** saves them automatically.

### Artwork

Each press of **Generate artwork** sends a fresh `Idempotency-Key`. If the response
is lost (API Gateway's 30 s limit, a Wi-Fi drop, a page reload), the app polls
`/api/artwork/requests/{id}` for that same request. It never presses "generate"
again on the child's behalf, because that could cost twice. The remaining daily
quota is shown under the button, which is disabled when the quota runs out.

### Printing and export

| Option | Output | Notes |
| --- | --- | --- |
| 🖼️ Picture | 750 × 1050 PNG | 300 DPI, tagged with a `pHYs` chunk, so it prints at 2.5 × 3.5 in |
| 📄 Download PDF | Letter, up to 9 cards per page | Cards placed at exactly 2.5 × 3.5 in (300-DPI images); vector crop marks |
| 🖨️ Print | Browser print of the live HTML | Vector text; choose **Actual size / 100%** in the print dialog. "Save as PDF" here gives a fully vector PDF |

Exports render the card off-screen at its true print size, then rasterize it
(`html-to-image`). Artwork is loaded with CORS from presigned S3 URLs, so the
bucket's CORS rules (set in `pokemaker-infra`) must allow the site's origin.

### PINs

Each player can protect their collection with a 4-digit PIN ("🔐 Add a PIN" in
the gallery). Anyone can still look at any collection; editing, copying,
deleting and generating artwork ask for the PIN first, on a big keypad. A
parent's PIN unlocks every profile, so it also resets a kid's forgotten PIN
(unlock their profile, then "Change PIN").

Unlocking lasts 2 hours, only in that browser tab, and ends when someone presses
"Switch player" or "🔒 Lock". If it runs out mid-edit, the editor keeps the
changes on the device, asks for the PIN again, then saves (`useCardEditor`'s
`locked` state). The API enforces all of this; the app just keeps the tokens
(`lib/unlock.ts`, `components/UnlockProvider.tsx`).

## Privacy note

Profiles are a convenience for a family sharing a device; they are **not** logins.
PINs stop siblings from changing each other's cards, but anyone who can reach
the API can still see every card. See the security section of
`pokemaker-api/README.md`.
