'use client'

import { memo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/cn'
import { dexNumber, type Pokemon } from '@/lib/pokemon'
import { spriteUrl } from '@/lib/sprites'

export type PokemonCardProps = {
  pokemon: Pokemon
  caught: boolean
  /** When provided the card is interactive; otherwise it is read-only. */
  onToggle?: (pokemonId: number) => void
  /** Disables the toggle while a write is in flight. */
  pending?: boolean
}

/**
 * A single dex entry.
 *
 * Caught state is conveyed three ways — a text label, a filled/hollow marker
 * and the gold wash — so it never depends on colour alone. Memoised because a
 * generation renders up to 156 of these and only the toggled card changes.
 */
export const PokemonCard = memo(function PokemonCard({
  pokemon,
  caught,
  onToggle,
  pending,
}: PokemonCardProps) {
  const interactive = Boolean(onToggle)

  return (
    <li
      className={cn(
        'flex flex-col rounded-lg border bg-surface p-2.5 shadow-sm',
        'transition-colors duration-(--transition-fast)',
        caught
          ? 'card-shine border-shine/35'
          : 'border-line hover:border-line-strong',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-ink-subtle tabular-nums">
          {dexNumber(pokemon.id)}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'size-2 rounded-full',
            caught ? 'bg-shine' : 'border border-line-strong',
          )}
        />
      </div>

      <div className="flex h-[72px] items-center justify-center">
        <Image
          src={spriteUrl(pokemon.id, caught)}
          alt=""
          width={72}
          height={72}
          className="sprite h-[72px] w-[72px] object-contain"
          loading="lazy"
          unoptimized
        />
      </div>

      <p className="truncate text-center text-[11px] font-medium text-ink">
        {pokemon.name}
      </p>

      {interactive ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => onToggle?.(pokemon.id)}
          aria-pressed={caught}
          className={cn(
            'mt-2 w-full rounded-md border px-2 py-1.5 text-[11px] font-semibold',
            'transition-colors duration-(--transition-fast)',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-hover',
            'disabled:cursor-not-allowed disabled:opacity-55',
            caught
              ? 'border-shine/40 bg-shine-soft text-shine hover:border-shine/70'
              : 'border-line bg-chip text-ink-muted hover:bg-surface-hover hover:text-ink',
          )}
        >
          <span className="sr-only">
            {caught ? `Unmark ${pokemon.name} as shiny` : `Mark ${pokemon.name} as shiny`}
          </span>
          <span aria-hidden="true">{caught ? 'Shiny ✦' : 'Mark shiny'}</span>
        </button>
      ) : (
        <p
          className={cn(
            'mt-2 w-full rounded-md border px-2 py-1.5 text-center text-[11px] font-semibold',
            caught
              ? 'border-shine/40 bg-shine-soft text-shine'
              : 'border-line bg-chip text-ink-subtle',
          )}
        >
          {caught ? 'Shiny ✦' : 'Missing'}
        </p>
      )}
    </li>
  )
})
