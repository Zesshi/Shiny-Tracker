'use client'

import { EmptyState } from '@/components/ui'
import type { GenerationView } from '@/hooks/use-dex'
import { GenerationSection } from './generation-section'

export type DexListProps = {
  generations: readonly GenerationView[]
  toggleGen: (key: string) => void
  isCaught: (id: number) => boolean
  isFiltering: boolean
  totalMatches: number
  /** Omit to render the whole list read-only. */
  onTogglePokemon?: (pokemonId: number) => void
}

/**
 * Renders every generation in the registry, in registry order.
 *
 * There is no per-generation branching here — adding a generation to
 * lib/gens.ts makes it appear automatically.
 */
export function DexList({
  generations,
  toggleGen,
  isCaught,
  isFiltering,
  totalMatches,
  onTogglePokemon,
}: DexListProps) {
  if (generations.length === 0) {
    return (
      <EmptyState
        title="No generations configured"
        description="Add a generation to src/lib/gens.ts to populate the dex."
      />
    )
  }

  if (isFiltering && totalMatches === 0) {
    return (
      <EmptyState
        title="No Pokémon found"
        description="Try a different name or dex number, or switch the filter back to All."
      />
    )
  }

  return (
    <>
      {generations.map(view => (
        <GenerationSection
          key={view.gen.key}
          gen={view.gen}
          visible={view.visible}
          have={view.have}
          total={view.total}
          open={view.open}
          onToggle={() => toggleGen(view.gen.key)}
          isCaught={isCaught}
          onTogglePokemon={onTogglePokemon}
          isFiltering={isFiltering}
        />
      ))}
    </>
  )
}
