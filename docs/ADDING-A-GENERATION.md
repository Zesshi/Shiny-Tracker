# Adding a generation

Adding a generation is a **one-line change** plus a data regeneration. No new
page, route or component is required, and no existing component needs editing.

## 1. Add the generation

Append one entry to `GENERATION_SOURCE` in [`src/lib/gens.ts`](../src/lib/gens.ts):

```ts
const GENERATION_SOURCE: readonly GenerationSource[] = [
  // …existing generations…
  { key: 'gen10', region: 'Lumiose', start: 1026, end: 1100 },
]
```

Only four fields are required:

| Field    | Meaning                                                        |
| -------- | -------------------------------------------------------------- |
| `key`    | Stable id. Also the banner filename (`/gen/<key>.webp`).          |
| `region` | Region name shown next to the generation number.                 |
| `start`  | First national-dex id, inclusive.                                |
| `end`    | Last national-dex id, inclusive.                                 |
| `hue`    | *Optional.* 0–360, tints the fallback banner. Derived if omitted.|
| `bannerFocus` | *Optional.* Vertical focal point (0–100%) for shallow artwork crops; defaults to 36. |

Everything else is derived automatically:

- the generation number (`Gen 10`) from its position in the list
- the display label (`Gen 10 • Lumiose`)
- the entry count (`75`)
- `TOTAL_POKEMON`, which drives every "x / y" total in the app
- ordering — the list order **is** the display order

## 2. Regenerate the dex data

The Pokémon list is bundled rather than fetched at runtime. Regenerate it:

```bash
npx tsx scripts/fetch-pokemon.ts
```

The script reads `TOTAL_POKEMON` from the registry, so there is no separate
limit to keep in sync.

## 3. Add banner artwork (optional)

Drop a WebP at `public/gen/<key>.webp` — e.g. `public/gen/gen10.webp`.

**This is genuinely optional.** If the file is absent the banner falls back to a
gradient derived from the generation's hue. It is not a broken image, and
nothing throws. Keep artwork small (roughly 80–150 KB per panorama) since
they are served from Vercel's free-tier bandwidth. The current artwork uses
1440-pixel-wide WebP exports at quality 80; see [REGION-ARTWORK.md](REGION-ARTWORK.md)
for the assets and exact generation prompts. Keep important scenery near the
vertical center for shallow desktop crops and leave the left side quiet for text.

## That's it

There is deliberately no step 4. Verified behaviour when a generation is added
with **no** artwork and **no** dex data yet:

- it renders in order on `/` and on every public profile
- the banner shows the gradient fallback
- totals, progress bars and completion tiers all compute
- opening it shows an empty state ("No dex entries are available for … yet")
  rather than crashing

## What you should *not* need to touch

These used to require an edit per generation and no longer do:

| File                          | Previously                                        |
| ----------------------------- | ------------------------------------------------- |
| `src/app/page.tsx`            | hard-coded `1025` total                            |
| `src/app/u/[username]/page.tsx` | hard-coded `1025` total, duplicated accordion    |
| `src/components/Stats.tsx`    | parsed `"Gen 1 • Kanto"` with `.split('•')`        |
| `public/sw.js`                | listed every `/gen/*.jpg` in the precache array    |
| `scripts/fetch-pokemon.ts`    | hard-coded `limit = 1025`                          |

## Removing or reordering

Reordering `GENERATION_SOURCE` reorders the UI and renumbers the generations,
because the ordinal is positional. If you ever need a generation whose number
does not match its position, add an explicit field to `GenerationSource` rather
than reordering.
