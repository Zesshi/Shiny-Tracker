# Collector experience redesign

Developed on `codex/collector-experience` and approved for release to `main`.

## Interface

- Dark field-journal design with mint navigation, gold catch states, existing Pokémon artwork, desktop side navigation, and mobile bottom navigation.
- Shared collection summary with caught/missing totals and regional completion calculated from the existing catches read.
- Filters with counts, name/number search (including `#0001`), and clear-filter recovery. Matching-result counts appear only while filtering; the redundant total row and region-jump dropdown are removed.
- Larger whole-card catch targets; keyboard focus, pressed state, per-card saving feedback, read-only public cards, and sprite failure fallback.
- Illustrated sign-in and account creation; focused trainer search; clearer profile and privacy settings.
- Nine original region panoramas replace the supplied placeholder banners. Taller headers, a lighter central overlay, and shaded progress badges keep the landscape visible and labels readable. See [REGION-ARTWORK.md](REGION-ARTWORK.md) for all images and generation prompts.
- Persistent, dismissible save-error/offline notices and short successful-save notifications.

## Behavior and efficiency

Database schema, Supabase client, RLS assumptions, account flows, catch write operations, search debounce/limits, and routes are retained. No database migrations, new runtime dependencies, polling, Realtime, SSR data queries, or image optimization were introduced. The package manifest and lockfile are unchanged.

Only Kanto's grid is mounted initially. Collapsed grids still render no sprites. All Pokémon filtering and progress calculations remain local. The service worker updates the app-shell cache but keeps the original immutable sprite cache.

Catch toggles now lock the affected entry while saving and roll back only that entry on failure. The stable toggle callback preserves memoization for untouched cards. Public catch-query failures display an error instead of zero progress. Trainer search clears stale results while a newer search is pending. Failed sign-out stays visible instead of pretending the session ended.

## Local testing

The preview runs at `http://127.0.0.1:3000`. Its ignored `.env.local` uses the same public Supabase configuration as the deployed app. Sign in with your existing account. Changes made through the local preview affect that same database.

Suggested checks:

1. Sign in by username or email; compare your collection totals with the deployed app.
2. Mark a Pokémon, confirm the sprite/count update, and unmark it to restore your data.
3. Search a name or `#0001`; try Caught and Missing; clear the filters.
4. Expand another region, collapse it, and use keyboard focus to operate cards.
5. Find a trainer and verify their public dex is read-only.
6. Review profile visibility and password forms without saving unless you intend to change the live account.
7. Resize to a phone width and check bottom navigation, filters, and card targets.

Checks performed during implementation:

- TypeScript, ESLint, and production build.
- `node scripts/verify-ui.cjs`: catalogue integrity, unmounted collapsed grids, lazy direct sprites, read-only cards, pending controls, completion totals, loading semantics, and empty-state recovery. This uses the installed TypeScript/React packages; no test framework is added.
- Public Supabase configuration endpoint and the three sign-in sprite URLs returned HTTP 200.
- Local route HTTP checks, without automated sign-in or live database writes.

Authenticated interaction and visual browser testing are left for the user. The legacy offline queue's user scoping, error handling during flush, and initial reconciliation remain pre-existing limitations documented in `REPOSITORY-OVERVIEW.md`; they have not been silently replaced as part of this interface work.

Development uses `.next-dev` and production uses `.next`, allowing builds alongside the local preview. To restart the preview: `npm run dev -- --hostname 127.0.0.1 --port 3000`.
