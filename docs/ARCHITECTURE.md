# Architecture & UI guide

Shiny Tracker is a Next.js 15 App Router app on Vercel's free tier, backed by
Supabase. Every route is a client component that talks to Supabase directly
under RLS. There are **no API routes, no middleware and no server actions** —
this is deliberate, and keeps serverless invocations near zero.

---

## 1. Project layout

```
src/
  app/                    routes (all 'use client')
    layout.tsx            html shell, AuthProvider, header, skip link
    page.tsx              /            signed-in shiny dex
    login/page.tsx        /login       sign in + sign up
    search/page.tsx       /search      trainer lookup
    settings/page.tsx     /settings    profile + password
    u/[username]/page.tsx /u/:username public profile
    globals.css           Tailwind entry + design tokens
  components/
    ui/                   design system primitives (see §3)
    dex/                  generation + Pokémon rendering (see §4)
    auth-provider.tsx     session resolution, shared once per page load
    nav.tsx               application header
    trainer-search.tsx    shared username search (header + /search)
  hooks/
    use-dex.ts            all dex list state and derivation
  lib/
    gens.ts               generation registry — single source of truth
    pokemon.ts            bundled dex data + per-generation grouping
    sprites.ts            sprite URL builder
    supabase.ts           browser Supabase client
    types.ts              types mirroring the Supabase schema
    errors.ts             user-safe error messages
    cn.ts                 class-name joiner
    offline-queue.ts      localStorage write queue
```

---

## 2. Design tokens

All tokens live in the `@theme` block of
[`src/app/globals.css`](../src/app/globals.css) and are exposed as Tailwind
utilities. **Change them there and nowhere else.**

| Group    | Tokens                                                                |
| -------- | --------------------------------------------------------------------- |
| Surfaces | `canvas`, `surface`, `surface-hover`, `chip`                          |
| Lines    | `line`, `line-strong`                                                 |
| Text     | `ink`, `ink-muted`, `ink-subtle`                                      |
| Brand    | `brand`, `brand-hover`, `brand-ink`, `brand-soft`                     |
| Shiny    | `shine`, `shine-soft`                                                 |
| Status   | `success`, `danger`, `warning` (+ `-soft` variants)                   |
| Radii    | `--radius-sm/md/lg/xl` (6/8/12/16px)                                  |
| Shadows  | `--shadow-sm/md/lg`                                                   |
| Motion   | `--transition-fast` (120ms), `--transition-base` (180ms)              |
| Layout   | `--spacing-header` (3.5rem), also the sticky offset                   |

Usage: `bg-surface`, `text-ink-muted`, `border-line`, `rounded-lg`, etc.

> ### ⚠️ Do not revert the Tailwind entry point
>
> `globals.css` **must** start with `@import "tailwindcss"`. It previously used
> the Tailwind v3 directives (`@tailwind base/components/utilities`), which
> under v4 emit the utilities layer *without* the default theme. The result was
> that every theme-dependent utility — `p-4`, `text-2xl`, `bg-green-500`,
> `max-w-7xl` — was silently dropped from the build, and Preflight never ran.
> The stylesheet went from 7.6 KB to 22 KB when this was fixed.

The app is **dark-mode only**, as it always has been. `color-scheme: dark` is
set so native controls and scrollbars match. There is no light theme and no
toggle; adding one would mean auditing every token pair for contrast.

### Colour and contrast

`--color-brand` is `#2a75bb`. White text on it measures **4.88:1**, which clears
WCAG AA for normal text. Do not lighten it — a brighter blue drops below 4.5:1.

State is never signalled by colour alone. Caught Pokémon carry a text label
("Shiny ✦" / "Mark shiny"), an `aria-pressed` state, a filled marker and the
gold wash. Completion tiers pair colour with border weight and a text tier name
in the section's screen-reader heading.

---

## 3. UI primitives (`src/components/ui`)

Import from the barrel: `import { Button, Card } from '@/components/ui'`.

| Component                             | Notes                                              |
| ------------------------------------- | -------------------------------------------------- |
| `Button` / `LinkButton`               | 5 variants × 3 sizes. `LinkButton` for navigation. |
| `Input` / `Checkbox`                  | `label` is **required** — enforces labelled inputs. |
| `Select`                              | Options passed as data, not children.              |
| `Field`                               | Label + hint + error wiring; used by the above.    |
| `Card` / `CardHeader`                 | Surface container.                                 |
| `Badge`                               | 6 tones.                                           |
| `Alert`                               | `role="alert"` for errors, `role="status"` for info.|
| `Tabs` / `TabPanel`                   | WAI-ARIA tabs with arrow-key roving focus.         |
| `Spinner`, `Skeleton`, `PageLoading`  | Loading states.                                    |
| `EmptyState`, `ErrorState`            | Empty + failure states, both accept an action.     |
| `Container`, `PageHeader`, `Progress` | Layout primitives.                                 |

### Conventions

- `cn()` is a plain class joiner, **not** `tailwind-merge`. It does not resolve
  conflicting utilities. Components therefore expose `variant`/`size` props;
  use `className` only for additive concerns (layout, width, margin).
- Every interactive element gets a visible `focus-visible` ring.
- Motion is disabled under `prefers-reduced-motion`.

### Intentionally absent

There is **no Modal/Dialog or ConfirmDialog primitive**. Nothing in the app
opens one, and shipping an unused, focus-trapping dialog would be dead code.
Add one when a feature actually needs it.

---

## 4. How generation data flows

```
lib/gens.ts                     lib/pokemon.ts
  GENERATION_SOURCE   ──────►     POKEMON_BY_GEN
  (the only hand-                 (dex grouped by
   authored data)                  generation, once
        │                          at module load)
        ├─► GENS (derived: number, label, total, banner, hue)
        ├─► TOTAL_POKEMON        ◄── every "x / y" in the UI
        ├─► genForId(id)         ◄── O(1) id → generation lookup
        └─► completionTier()     ◄── bronze/silver/gold/complete
                    │
                    ▼
            hooks/use-dex.ts
      search · filter · accordion state
      caught set · per-generation counts
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
  components/dex/           components/dex/
    dex-toolbar.tsx           dex-list.tsx
                                  │
                                  ▼
                          generation-section.tsx
                                  │
                                  ▼
                            pokemon-card.tsx
```

Both `/` and `/u/[username]` use this same pipeline. The **only** difference is
that the signed-in dex passes an `onTogglePokemon` callback; when it is omitted
the cards render as read-only status chips. There is no per-generation
branching anywhere in the tree.

To add a generation, see [ADDING-A-GENERATION.md](./ADDING-A-GENERATION.md).

---

## 5. Contracts that must stay stable

### Supabase schema

Column names in `src/lib/types.ts` **are** the database columns.

| Table      | Columns                             |
| ---------- | ----------------------------------- |
| `profiles` | `id`, `email`, `username`, `is_public` |
| `catches`  | `user_id`, `pokemon_id`, `caught_shiny` — unique on (`user_id`, `pokemon_id`) |

The composite uniqueness is relied on by the `onConflict: 'user_id,pokemon_id'`
upsert in `lib/offline-queue.ts`.

### Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Both are `NEXT_PUBLIC_` by design — this app is browser-only and relies on RLS.
**There are no server-only secrets in this codebase**, and none should be added
without introducing a server route to hold them.

### Routes

`/`, `/login`, `/search`, `/settings`, `/u/[username]`. All static except
`/u/[username]`, which is rendered on demand.

---

## 6. Efficiency notes (Vercel + Supabase free tier)

These behaviours are load-bearing. Preserve them.

| Optimisation                                        | Where                        |
| --------------------------------------------------- | ---------------------------- |
| Dex bundled as JSON — no PokeAPI calls at runtime    | `src/data/pokemon.json`      |
| Sprites cached permanently by the service worker     | `public/sw.js`               |
| Images `unoptimized` — avoids Vercel's image quota   | `pokemon-card.tsx`, `next.config.ts` |
| Collapsed generations render no grid                 | `generation-section.tsx`     |
| Selective column lists on every query                | all pages                    |
| 250 ms debounce + row limit on trainer search        | `trainer-search.tsx`         |
| Optimistic writes with no refetch                    | `app/page.tsx`               |
| Session resolved **once** and shared                 | `auth-provider.tsx`          |
| No polling, no refresh intervals, no Realtime        | —                            |

The collapsed-accordion rule matters most: only Gen 1 is open on load, so first
paint requests ~151 sprites rather than ~1025.

### Things to avoid

- Do not enable Supabase Realtime.
- Do not add polling or `revalidate`.
- Do not convert client pages to SSR — it turns CDN hits into invocations.
- Do not replace targeted `select(...)` lists with `select('*')`.
- Do not route sprites through `next/image` optimisation.

---

## 7. Intentional compromises

1. **`cn()` is not `tailwind-merge`.** Avoids a dependency; the cost is that
   `className` cannot override a component's base utilities. Variants exist for
   that reason.
2. **Generation banners are no longer precached** by the service worker. They
   are cached on first view instead. This removed a per-generation edit point
   and stopped a missing image from failing the whole SW install
   (`cache.addAll` rejects atomically). Trade-off: on a cold offline first
   visit, banners show the gradient fallback.
3. **`/search` was an orphan route** — nothing linked to it. It has been kept
   (routes are contract) and is now reachable from the header nav.
4. **Owner-viewing-own-profile** no longer renders a "Manage on Home" button on
   every card; it is a single button in the page header. Same destination,
   ~1000 fewer DOM nodes.
5. **`Stats.tsx` was deleted.** It was never imported by anything.
6. **No test framework was added.** Verification was done by driving the running
   app; adding Jest/Vitest for a redesign was out of scope.
