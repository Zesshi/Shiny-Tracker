'use client'

import { useId, type CSSProperties } from 'react'
import {
  TIER_CLASS,
  TIER_LABEL,
  completionTier,
  type Generation,
} from '@/lib/gens'
import type { Pokemon } from '@/lib/pokemon'
import { EmptyState } from '@/components/ui'
import { Icon } from '@/components/icon'
import { PokemonCard } from './pokemon-card'

export type GenerationSectionProps = {
  gen: Generation
  visible: readonly Pokemon[]
  have: number
  total: number
  open: boolean
  onToggle: () => void
  isCaught: (id: number) => boolean
  onTogglePokemon?: (pokemonId: number) => void
  isFiltering: boolean
  pendingIds?: ReadonlySet<number>
}

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
  pendingIds,
}: GenerationSectionProps) {
  const panelId = `${useId()}-${gen.key}`
  const tier = completionTier(have, total)
  const percent = Math.round((have / total) * 100)
  return (
    <section
      className={`generation-section ${open ? 'is-open' : ''}`}
      aria-labelledby={`region-${gen.key}`}
    >
      <h2>
        <button
          id={`region-${gen.key}`}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={`gen-banner ${TIER_CLASS[tier]}`}
          style={
            {
              '--gen-image': `url('${gen.banner}')`,
              '--gen-hue': gen.hue,
              '--gen-focus': `${gen.bannerFocus}%`,
            } as CSSProperties
          }
        >
          <span className="gen-number">
            {String(gen.number).padStart(2, '0')}
          </span>
          <span className="gen-title">
            <span className="gen-eyebrow">
              GENERATION {gen.number} <span>·</span> #
              {String(gen.start).padStart(4, '0')}–
              {String(gen.end).padStart(4, '0')}
            </span>
            <span className="gen-region">
              {gen.region}
              <span className="gen-tier-label">
                {tier !== 'none' ? (
                  <>
                    <Icon name={tier === 'complete' ? 'trophy' : 'sparkles'} />
                    {TIER_LABEL[tier]}
                  </>
                ) : null}
              </span>
            </span>
          </span>
          <span className="gen-progress">
            <span>
              <strong>{have}</strong> / {total}
              <span>{percent}%</span>
            </span>
            <span className="gen-progress-track" aria-hidden="true">
              <i style={{ width: `${percent}%` }} />
            </span>
          </span>
          <Icon name="chevron" className="gen-chevron" />
          <span className="sr-only">
            {have} of {total} shinies caught. {TIER_LABEL[tier]}.
          </span>
        </button>
      </h2>
      <div id={panelId} hidden={!open}>
        {/* Unmounting collapsed grids prevents unnecessary sprite requests. */}
        {open &&
          (visible.length === 0 ? (
            <EmptyState
              className="mt-4"
              title="No matches in this region"
              description={
                isFiltering
                  ? `Try a different search or filter to explore ${gen.region}.`
                  : `No entries are available for ${gen.region} yet.`
              }
            />
          ) : (
            <>
              <div className="generation-grid-heading">
                <span>
                  {isFiltering ? `${visible.length} matching` : `${total}`}{' '}
                  Pokémon
                </span>
                <span>
                  {onTogglePokemon
                    ? 'Select a Pokémon to update your collection'
                    : 'Trainer’s collection · read only'}
                </span>
              </div>
              <ul className="pokemon-grid">
                {visible.map((p) => (
                  <PokemonCard
                    key={p.id}
                    pokemon={p}
                    caught={isCaught(p.id)}
                    onToggle={onTogglePokemon}
                    pending={pendingIds?.has(p.id)}
                  />
                ))}
              </ul>
            </>
          ))}
      </div>
    </section>
  )
}

export function GenerationSectionSkeleton() {
  return (
    <div className="mb-4" aria-hidden="true">
      <div className="h-36 w-full animate-pulse rounded-lg border border-line bg-surface max-[760px]:h-[118px]" />
    </div>
  )
}
