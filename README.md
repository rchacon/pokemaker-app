# pokemaker-app

The React frontend for **PokeMaker**: kids design their own trading cards, see a
live preview as they type, add AI artwork, and print real 2.5 × 3.5-inch cards.

React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router, tested with Vitest and
React Testing Library. Sibling repositories: [`pokemaker-api`](../pokemaker-api)
(FastAPI backend) and [`pokemaker-infra`](../pokemaker-infra) (Terraform).

## Run it locally

The backend must be running first. See `../pokemaker-api/README.md`, which comes
down to `docker compose up -d`, `python scripts/init_local.py`, then
`uvicorn pokemaker.main:app --reload`.

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
is lost (a proxy timeout, a Wi-Fi drop, a page reload), the app polls
`/api/artwork/requests/{id}` for that same request. It never presses "generate"
again on the child's behalf, because that could cost twice. The remaining daily
quota is shown under the button, which is disabled when the quota runs out.

### Printing and export

| Option | Output | Notes |
| --- | --- | --- |
| 🖼️ Picture | 750 × 1050 PNG | 300 DPI, tagged with a `pHYs` chunk, so it prints at 2.5 × 3.5 in |
| 📄 Download PDF | Letter, 6 or 9 cards per page | Cards placed at exactly 2.5 × 3.5 in (300-DPI images); vector cut guides |
| 🖨️ Print | Browser print of the live HTML | Vector text; choose **Actual size / 100%** in the print dialog. "Save as PDF" here gives a fully vector PDF |

**Spacing for laminating.** The print page offers spacing between cards:
**¼ in** (the default), **⅛ in**, or **None**. With spacing, 6 cards fit per
Letter page (3 × 2); with none, 9 (3 × 3). Laminate the whole sheet, then cut
along the dashed lines through the *middle* of each gap, so every card keeps a
sealed plastic edge (⅛ in with ¼-in spacing). Cutting at the card edge would
break the seal, so with spacing the guides never outline the card edge. The
choice is remembered per browser; the geometry lives in `lib/export/layout.ts`.

Exports render the card off-screen at its true print size, then rasterize it
(`html-to-image`). Artwork is loaded with CORS from presigned S3 URLs, so the
bucket's CORS rules (set in `pokemaker-infra`) must allow the site's origin.

## Privacy note

Profiles are a convenience for a family sharing a device; they are **not** logins.
Anyone who can reach the API can see and change every card. See the security
section of `pokemaker-api/README.md`.
