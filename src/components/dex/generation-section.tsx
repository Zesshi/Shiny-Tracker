'use client'

import { useId } from 'react'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'
import {
  TIER_CLASS,
  TIER_LABEL,
  completionTier,
  type Generation,
} from '@/lib/gens'
import type { Pokemon } from '@/lib/pokemon'
import { EmptyState, Progress } from '@/components/ui'
import { PokemonCard } from './pokemon-card'

type BannerStyle = CSSProperties & {
  '--gen-image'?: string
  '--gen-hue'?: string
}

export type GenerationSectionProps = {
  gen: Generation
  visible: readonly Pokemon[]
  have: number
  total: number
  open: boolean
  onToggle: () => void
  isCaught: (id: number) => boolean
  /** Omit to render the generation read-only. */
  onTogglePokemon?: (pokemonId: number) => void
  /** True when a search/filter is active, so the empty copy can differ. */
  isFiltering: boolean
}

/**
 * One collapsible generation: banner + grid.
 *
 * Entirely driven by the Generation record, so a newly added generation
 * renders here with no code change. The banner artwork is optional — if
 * /gen/<key>.jpg is missing the CSS falls back to a hue-derived gradient
 * rather than showing a broken image.
 *
 * Collapsed generations do not render their grid. This is load-bearing: it
 * keeps the DOM small and, more importantly, prevents ~1000 sprite requests
 * from firing on first paint.
 */
export function GenerationSection({
  gen,
  visible,
  have,
  total,
  open,
  onToggle,
  isCaught,
  onTogglePokemon,
  isFiltering,
}: GenerationSectionProps) {
  const panelId = `${useId()}-${gen.key}`
  const tier = completionTier(have, total)

  const bannerStyle: BannerStyle = {
    '--gen-image': `url('${gen.banner}')`,
    '--gen-hue': String(gen.hue),
  }

  return (
    <section className="mb-4" aria-labelledby={`${panelId}-heading`}>
      <h2 id={`${panelId}-heading`} className="sr-only">
        {gen.name} — {have} of {total} shinies caught, {TIER_LABEL[tier]}
      </h2>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        style={bannerStyle}
        className={cn(
          'gen-banner sticky top-(--sticky-offset) z-20 flex w-full items-center gap-3',
          'rounded-lg border px-3 py-3 text-left sm:px-4',
          'transition-colors duration-(--transition-fast)',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-hover',
          tier === 'none' ? 'border-line' : 'border-2',
          TIER_CLASS[tier],
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={cn(
            'size-4 shrink-0 text-white/80 transition-transform duration-(--transition-fast)',
            open && 'rotate-180',
          )}
        >
          <path
            d="M7 10l5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-white sm:text-base">
              {gen.shortLabel}
            </span>
            <span className="text-sm text-white/70">{gen.region}</span>
            <span className="font-mono text-[11px] text-white/45 tabular-nums">
              {gen.start}–{gen.end}
            </span>
          </span>
          <Progress
            value={have}
            max={total}
            tone={tier === 'complete' ? 'shine' : 'brand'}
            className="mt-2 max-w-56 bg-black/40"
          />
        </span>

        <span className="shrink-0 text-right">
          <span className="block font-mono text-sm font-semibold text-white tabular-nums">
            {have}/{total}
          </span>
          {tier !== 'none' && (
            <span className="mt-0.5 block text-[10px] font-medium tracking-wide text-white/60 uppercase">
              {TIER_LABEL[tier]}
            </span>
          )}
        </span>
      </button>

      <div id={panelId} hidden={!open}>
        {open &&
          (visible.length === 0 ? (
            <EmptyState
              className="mt-3"
              title="Nothing here"
              description={
                isFiltering
                  ? `No ${gen.region} Pokémon match the current search and filter.`
                  : `No dex entries are available for ${gen.region} yet.`
              }
            />
          ) : (
            <ul className="mt-3 grid list-none grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]">
              {visible.map(p => (
                <PokemonCard
                  key={p.id}
                  pokemon={p}
                  caught={isCaught(p.id)}
                  onToggle={onTogglePokemon}
                />
              ))}
            </ul>
          ))}
      </div>
    </section>
  )
}

/** Placeholder shown while catches are still loading. */
export function GenerationSectionSkeleton() {
  return (
    <div className="mb-4" aria-hidden="true">
      <div className="h-[70px] w-full animate-pulse rounded-lg border border-line bg-surface" />
    </div>
  )
}
