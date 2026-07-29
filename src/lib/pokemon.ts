import rawData from '@/data/pokemon.json'
import { GENS, genForId, type Generation } from './gens'

/**
 * The bundled dex.
 *
 * pokemon.json ships with the app rather than being fetched at runtime — this
 * is a deliberate traffic optimisation (no PokeAPI calls, no Supabase reads,
 * no function invocations for static reference data). Regenerate it with
 * `scripts/fetch-pokemon.ts`.
 */
export type Pokemon = {
  id: number
  name: string
  /** Present in the dataset but unused; sprites are built by spriteUrl(). */
  sprite?: string
}

export const POKEMON = rawData as Pokemon[]

/**
 * Pokemon grouped by generation key, computed once at module load.
 *
 * Entries whose id falls outside every generation range are omitted — see the
 * documented rule on TOTAL_POKEMON in lib/gens.ts. Grouping here means pages
 * never scan the full 1025-entry list per generation while rendering.
 */
export const POKEMON_BY_GEN: Readonly<Record<string, readonly Pokemon[]>> = (() => {
  const groups: Record<string, Pokemon[]> = {}
  for (const g of GENS) groups[g.key] = []
  for (const p of POKEMON) {
    const gen = genForId(p.id)
    if (gen) groups[gen.key].push(p)
  }
  return groups
})()

/** Pokemon belonging to `gen`. Always returns an array, never undefined. */
export function pokemonForGen(gen: Generation): readonly Pokemon[] {
  return POKEMON_BY_GEN[gen.key] ?? []
}

/** Zero-padded national dex number, e.g. 25 -> "#0025". */
export function dexNumber(id: number): string {
  return `#${id.toString().padStart(4, '0')}`
}
