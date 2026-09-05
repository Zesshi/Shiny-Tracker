# Shiny Tracker: repository overview

## What the app does

Shiny Tracker records which shiny Pokémon a trainer owns across nine generations (Kanto through Paldea), covering 1,025 national dex entries. Trainers can search by Pokémon name or number, filter all/caught/missing entries, expand regions, and see overall and regional completion. A catch changes the displayed sprite to its shiny variant.

The app also supports email or username sign-in, account creation, trainer lookup, public collection pages, profile visibility, username changes, and password changes. It includes an installable PWA manifest and an offline write queue.

## Routes and behavior

| Route | Purpose | Data access |
| --- | --- | --- |
| `/` | Authenticated collection; mark/unmark catches | One targeted catches read on mount; an insert/update/delete for each catch toggle |
| `/login` | Sign in or create an account | Supabase Auth; targeted profile lookup for username sign-in/availability |
| `/search` | Find trainers by username | Debounced, limited profile search; no query for empty input |
| `/settings` | Edit username, visibility, password | One profile read; availability check and update on save; Auth password update |
| `/u/[username]` | Read-only trainer collection | Targeted profile and catches reads; private collection access relies on RLS |

## How it is assembled

- **Next.js 15 App Router + React 19 + TypeScript.** Pages are client components. There are no API routes, server actions, or middleware. Most route shells are static; the username route is rendered on demand.
- **Shared authentication:** `AuthProvider` validates the user once and shares the session. `useRequireAuth` redirects anonymous visitors to sign-in. The local auth event subscription updates shared state.
- **Shared collection pipeline:** `gens.ts` defines region ranges and completion tiers; `pokemon.ts` groups bundled JSON at module load; `useDex` derives search results, catch membership, regional counts, and accordion state. Both private and public collections use the same toolbar, list, region, and card components.
- **Catch writes:** the home page updates React state immediately, writes directly to Supabase, and rolls back on online errors. Offline failures are queued in localStorage and retried when connectivity returns.
- **UI:** Tailwind v4, global theme tokens, and existing accessible primitives for inputs, buttons, tabs, feedback, and progress. The application is dark-only.
- **Images:** existing regional artwork lives in `public/gen`; normal/shiny sprites load directly from the PokeAPI GitHub sprite repository. No runtime PokéAPI data fetching.

## Database contracts to preserve

| Table | Columns used |
| --- | --- |
| `profiles` | `id`, `email`, `username`, `is_public` |
| `catches` | `user_id`, `pokemon_id`, `caught_shiny` |

Catch queue upserts depend on uniqueness of `(user_id, pokemon_id)`. Browser access depends on deployed Supabase Row Level Security policies. SQL definitions, policies, and the apparent signup profile-creation trigger are not included in this repository, so their live behavior cannot be verified from source alone.

Configuration uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. They are public browser credentials; database permissions belong in RLS. This checkout initially contained no environment file.

## Free-plan efficiency requirements

1. Keep data access in the browser; no new SSR queries, functions, polling, Realtime, or periodic refreshes.
2. Keep the Pokémon catalogue bundled and all collection searches/aggregates local.
3. Keep collapsed region grids unmounted. Initially only Kanto is expanded; lazy loading further limits sprite downloads.
4. Keep images unoptimized and retain direct sprite URLs and service-worker caching.
5. Keep selective column lists and trainer-search debounce (250 ms), with limits of 10 in the navigation and 20 on the search page.
6. Reuse optimistic write results rather than refetching the collection or profile after changes.
7. Preserve one shared authentication provider and the existing routes/schema.

## Existing limitations found during review

- Database policies and triggers are external to the repo; a successful build cannot verify them.
- The legacy offline queue is device-wide rather than user-scoped. It also clears its queue without inspecting returned Supabase errors, and initial catch loading can race queue flushing. These are pre-existing sync concerns, separate from the interface redesign.
- Public catch read failures currently appear as an empty collection. This can be misleading and should have an explicit error state.
- Catch toggles previously allowed overlapping requests and restored the entire previous collection on failure, which could undo unrelated successful local changes. Per-entry pending states and targeted rollback can improve this without additional queries.

## Local verification

Install using `npm ci`, supply the two public Supabase environment values in an ignored `.env.local`, then use `npm run dev`. Validate with `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Authenticated database workflows require a real session; do not substitute fake collection data or bypass access controls.
