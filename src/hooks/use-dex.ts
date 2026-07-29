'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_OPEN_GEN, GENS, TOTAL_POKEMON, genForId } from '@/lib/gens'
import { POKEMON, pokemonForGen, type Pokemon } from '@/lib/pokemon'
import type { Catch } from '@/lib/types'

export type DexFilter = 'all' | 'missing' | 'caught'

export const DEX_FILTER_OPTIONS: readonly { value: DexFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'missing', label: 'Missing' },
  { value: 'caught', label: 'Caught' },
]

function matchesQuery(p: Pokemon, needle: string): boolean {
  if (!needle) return true
  return (
    p.name.toLowerCase().includes(needle) ||
    p.id.toString() === needle.replace('#', '')
  )
}

export type GenerationView = {
  gen: (typeof GENS)[number]
  /** Pokemon in this generation that pass the current filter + search. */
  visible: readonly Pokemon[]
  /** Shinies owned in this generation, regardless of filter. */
  have: number
  /** Total dex entries in this generation. */
  total: number
  open: boolean
}

/**
 * All list state for a shiny dex view: search, filter, per-generation
 * accordion state and the derived per-generation aggregates.
 *
 * Shared by the signed-in dex (/) and public profiles (/u/[username]) so the
 * two cannot drift apart. Purely client-side derivation — it issues no
 * requests of its own and reuses the `catches` rows the page already fetched.
 */
export function useDex(catches: readonly Catch[]) {
  const [filter, setFilter] = useState<DexFilter>('all')
  const [query, setQuery] = useState('')

  const defaultOpen = useMemo(
    () =>
      Object.fromEntries(
        GENS.map(g => [g.key, g.key === DEFAULT_OPEN_GEN]),
      ) as Record<string, boolean>,
    [],
  )
  const [open, setOpen] = useState<Record<string, boolean>>(() => defaultOpen)

  /**
   * Set of owned dex ids. Replaces the previous `catches.some(...)` scan that
   * ran once per Pokemon per render (~1M comparisons per keystroke on a full
   * dex); membership is now O(1).
   */
  const caughtIds = useMemo(() => {
    const set = new Set<number>()
    for (const c of catches) if (c.caught_shiny) set.add(c.pokemon_id)
    return set
  }, [catches])

  const isCaught = useCallback((id: number) => caughtIds.has(id), [caughtIds])

  const caughtCount = caughtIds.size

  /** Owned shinies per generation, independent of the active filter. */
  const haveByGen = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const g of GENS) counts[g.key] = 0
    for (const id of caughtIds) {
      const gen = genForId(id)
      if (gen) counts[gen.key] += 1
    }
    return counts
  }, [caughtIds])

  const needle = query.trim().toLowerCase()

  /** Filtered ids per generation. Grouping happens once, not per generation. */
  const visibleByGen = useMemo(() => {
    const result: Record<string, Pokemon[]> = {}
    for (const g of GENS) {
      const all = pokemonForGen(g)
      result[g.key] =
        filter === 'all' && !needle
          ? (all as Pokemon[])
          : all.filter(p => {
              const caught = caughtIds.has(p.id)
              const passesFilter =
                filter === 'all' ? true : filter === 'caught' ? caught : !caught
              return passesFilter && matchesQuery(p, needle)
            })
    }
    return result
  }, [filter, needle, caughtIds])

  /** While searching, open exactly the generations that contain a match. */
  useEffect(() => {
    if (!needle) return
    setOpen(() => {
      const next: Record<string, boolean> = {}
      for (const g of GENS) next[g.key] = visibleByGen[g.key].length > 0
      return next
    })
  }, [needle, visibleByGen])

  /**
   * When the search is cleared, fall back to the default open generation.
   *
   * Deliberately keyed on `needle` only. `visibleByGen` is derived from
   * `caughtIds`, so including it here would re-run this on every toggle and
   * collapse whichever generation the user is marking shinies in — you could
   * only mark one Pokemon per generation before being bounced back to Gen 1.
   * Keep these two effects separate.
   */
  useEffect(() => {
    if (needle) return
    setOpen(defaultOpen)
  }, [needle, defaultOpen])

  const toggleGen = useCallback((key: string) => {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const generations: GenerationView[] = useMemo(
    () =>
      GENS.map(gen => ({
        gen,
        visible: visibleByGen[gen.key] ?? [],
        have: haveByGen[gen.key] ?? 0,
        total: gen.total,
        open: open[gen.key] ?? false,
      })),
    [visibleByGen, haveByGen, open],
  )

  const totalMatches = useMemo(
    () => generations.reduce((n, g) => n + g.visible.length, 0),
    [generations],
  )

  return {
    filter,
    setFilter,
    query,
    setQuery,
    generations,
    toggleGen,
    isCaught,
    caughtCount,
    totalMatches,
    /** True when a filter or search is narrowing the list. */
    isFiltering: filter !== 'all' || needle !== '',
    totalPokemon: TOTAL_POKEMON,
    dexSize: POKEMON.length,
  }
}
