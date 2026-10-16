# pokemaker-app

The React frontend for **PokeMaker**: kids design their own trading cards and
keep them in a collection.

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
│   └── Gallery.tsx            One child's collection: copy, delete
├── components/
│   ├── PokemonCard.tsx/.css   The card itself (used everywhere)
│   └── EnergyIcon.tsx         Original SVG type icons
├── hooks/
│   └── useProfiles.ts
└── lib/
    ├── api.ts                 Typed fetch client; structured ApiError
    └── drafts.ts              localStorage: last profile
```

### One card renderer for everything

`PokemonCard` draws the whole card (name, HP, icons, attacks, weakness, borders)
with HTML, CSS and SVG from card data. Only the creature picture comes from the
AI, so changing text never needs new artwork. Every size inside the card uses
`cqw` (container-query width units), so the same markup renders at any size,
from gallery thumbnails to a full-size card.

Long names shrink smoothly (`lib/textFit.ts`) and long attack or flavor text is
clamped, so the layout never breaks.

## Privacy note

Profiles are a convenience for a family sharing a device; they are **not** logins.
Anyone who can reach the API can see and change every card. See the security
section of `pokemaker-api/README.md`.
