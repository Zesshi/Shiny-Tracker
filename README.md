# Shiny Tracker

Track your shiny Pokémon collection across every generation. Next.js 15 (App
Router) + Supabase, deployed on Vercel's free tier.

## Getting started

```bash
npm install
npm run dev
```

Create a `.env` file with:

```
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…
```

Both are public by design — the app is browser-only and access is enforced by
Supabase Row Level Security. There are no server-side secrets.

Open <http://localhost:3000>.

## Scripts

| Command                            | Description                        |
| ---------------------------------- | ---------------------------------- |
| `npm run dev`                      | Dev server                         |
| `npm run build`                    | Production build                   |
| `npm run lint`                     | ESLint                             |
| `npx tsc --noEmit`                 | Type check                         |
| `npx tsx scripts/fetch-pokemon.ts` | Regenerate `src/data/pokemon.json` |

## Routes

| Route           | Rendering | Description                    |
| --------------- | --------- | ------------------------------ |
| `/`             | static    | Your shiny dex (auth required) |
| `/login`        | static    | Sign in / create account       |
| `/search`       | static    | Find trainers by username      |
| `/settings`     | static    | Profile and password           |
| `/u/[username]` | dynamic   | A trainer's public dex         |

## Documentation

- **[docs/REPOSITORY-OVERVIEW.md](docs/REPOSITORY-OVERVIEW.md)** — what the
  app does, route behavior, database contracts, and findings from the source review.
- **[docs/REDESIGN.md](docs/REDESIGN.md)** — redesign changes and local testing guide.

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — project layout, design
  tokens, UI primitives, data flow, stable contracts, efficiency rules.
- **[docs/ADDING-A-GENERATION.md](docs/ADDING-A-GENERATION.md)** — how to add
  Gen 10 and beyond (it's one line).

## Before you change anything

Two rules that are easy to break by accident:

1. `src/app/globals.css` must start with `@import "tailwindcss"`. The v3
   directives (`@tailwind base` …) silently disable most of Tailwind under v4.
2. This app is tuned for free-tier hosting: no polling, no Realtime, no SSR, no
   image optimisation, and collapsed generations render nothing. See the
   efficiency section of the architecture doc before adding data fetching.
