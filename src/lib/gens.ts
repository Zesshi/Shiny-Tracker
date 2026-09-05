/**
 * Generation registry — the single source of truth for generations.
 *
 * ===========================================================================
 *  TO ADD A NEW GENERATION: append one entry to GENERATION_SOURCE below.
 *  Nothing else in the UI needs to change. See docs/ADDING-A-GENERATION.md.
 * ===========================================================================
 *
 * Everything else (ordinal number, display label, totals, dex size, banner
 * URL, fallback colour) is derived from that list, so there are no
 * generation-specific values scattered through components.
 */

/** The only hand-authored data per generation. */
type GenerationSource = {
  /** Stable identifier. Also the banner filename: /gen/<key>.webp */
  key: string
  /** Region name, e.g. "Kanto". Combined with the ordinal for display. */
  region: string
  /** Inclusive national-dex id range. */
  start: number
  end: number
  /**
   * Optional hue (0-360) for the banner fallback gradient shown when no
   * artwork exists at /gen/<key>.webp. Derived from position when omitted.
   */
  hue?: number
  /** Vertical focal point (0–100%) for shallow desktop artwork crops. */
  bannerFocus?: number
}

const GENERATION_SOURCE: readonly GenerationSource[] = [
  { key: 'gen1', region: 'Kanto', start: 1, end: 151, hue: 6, bannerFocus: 24 },
  { key: 'gen2', region: 'Johto', start: 152, end: 251, hue: 42 },
  { key: 'gen3', region: 'Hoenn', start: 252, end: 386, hue: 150, bannerFocus: 24 },
  { key: 'gen4', region: 'Sinnoh', start: 387, end: 493, hue: 205, bannerFocus: 18 },
  { key: 'gen5', region: 'Unova', start: 494, end: 649, hue: 260 },
  { key: 'gen6', region: 'Kalos', start: 650, end: 721, hue: 320, bannerFocus: 16 },
  { key: 'gen7', region: 'Alola', start: 722, end: 809, hue: 25, bannerFocus: 20 },
  { key: 'gen8', region: 'Galar', start: 810, end: 905, hue: 285 },
  { key: 'gen9', region: 'Paldea', start: 906, end: 1025, hue: 350, bannerFocus: 24 },
]

export type Generation = {
  key: string
  /** 1-based ordinal, derived from position in the list. */
  number: number
  region: string
  start: number
  end: number
  /** Count of dex entries in this generation. */
  total: number
  /** "Gen 1" */
  shortLabel: string
  /**
   * "Gen 1 • Kanto". Kept as `name` for backwards compatibility with the
   * original Gen type; prefer `shortLabel` / `region` over parsing this.
   */
  name: string
  /** Path to the banner artwork. May 404 — the UI falls back to a gradient. */
  banner: string
  bannerFocus: number
  hue: number
}

/** Original type name, kept so existing imports keep working. */
export type Gen = Generation

export const GENS: readonly Generation[] = GENERATION_SOURCE.map((g, i) => {
  const number = i + 1
  return {
    key: g.key,
    number,
    region: g.region,
    start: g.start,
    end: g.end,
    total: g.end - g.start + 1,
    shortLabel: `Gen ${number}`,
    name: `Gen ${number} • ${g.region}`,
    banner: `/gen/${g.key}.webp`,
    bannerFocus: g.bannerFocus ?? 36,
    hue: g.hue ?? (number * 40) % 360,
  }
})

/**
 * Size of the full dex, derived from the generation ranges.
 *
 * Documented rule: generations define the dex. An entry in pokemon.json that
 * falls outside every generation range is not displayed until a generation
 * covering it is added. This keeps totals and rendering consistent instead of
 * letting the two disagree.
 */
export const TOTAL_POKEMON = GENS.reduce((sum, g) => sum + g.total, 0)

/** The generation opened by default on first load. */
export const DEFAULT_OPEN_GEN = GENS[0]?.key ?? ''

/* -------------------------------------------------------------------------- */
/* Lookup                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * id -> generation index, built once. Replaces the per-Pokemon linear scan
 * (`GENS.find(...)`) that previously ran inside render loops.
 */
const genIndexById = (() => {
  const max = GENS.reduce((m, g) => Math.max(m, g.end), 0)
  const index = new Int8Array(max + 1).fill(-1)
  GENS.forEach((g, i) => {
    for (let id = g.start; id <= g.end && id <= max; id++) index[id] = i
  })
  return index
})()

/** Returns the generation containing `id`, or undefined if none covers it. */
export function genForId(id: number): Generation | undefined {
  if (!Number.isInteger(id) || id < 1 || id >= genIndexById.length) return undefined
  const i = genIndexById[id]
  return i < 0 ? undefined : GENS[i]
}

/* -------------------------------------------------------------------------- */
/* Completion tiers                                                            */
/* -------------------------------------------------------------------------- */

export type CompletionTier = 'none' | 'bronze' | 'silver' | 'gold' | 'complete'

const TIER_THRESHOLDS: readonly { tier: CompletionTier; min: number }[] = [
  { tier: 'complete', min: 1 },
  { tier: 'gold', min: 0.75 },
  { tier: 'silver', min: 0.5 },
  { tier: 'bronze', min: 0.25 },
]

/** Completion tier for `have` out of `total`. Centralised so the thresholds
 * are defined once rather than duplicated across pages. */
export function completionTier(have: number, total: number): CompletionTier {
  if (total <= 0) return 'none'
  const pct = have / total
  return TIER_THRESHOLDS.find(t => pct >= t.min)?.tier ?? 'none'
}

export const TIER_LABEL: Record<CompletionTier, string> = {
  none: 'Just started',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  complete: 'Complete',
}

/** CSS class applied to the banner for each tier (see globals.css). */
export const TIER_CLASS: Record<CompletionTier, string> = {
  none: '',
  bronze: 'gen-tier-bronze',
  silver: 'gen-tier-silver',
  gold: 'gen-tier-gold',
  complete: 'gen-tier-rainbow',
}
