'use client'

import { memo, useState } from 'react'
import Image from 'next/image'
import { dexNumber, type Pokemon } from '@/lib/pokemon'
import { spriteUrl } from '@/lib/sprites'
import { Icon } from '@/components/icon'
import { Spinner } from '@/components/ui'

export type PokemonCardProps = {
  pokemon: Pokemon
  caught: boolean
  onToggle?: (pokemonId: number) => void
  pending?: boolean
}

export const PokemonCard = memo(function PokemonCard({
  pokemon,
  caught,
  onToggle,
  pending,
}: PokemonCardProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const source = spriteUrl(pokemon.id, caught)
  const content = (
    <>
      <span className="pokemon-card-top">
        <span>{dexNumber(pokemon.id)}</span>
        <span
          className={`catch-marker ${caught ? 'is-caught' : ''}`}
          aria-hidden="true"
        >
          {caught ? <Icon name="sparkles" /> : <span />}
        </span>
      </span>
      <span className="pokemon-sprite-wrap">
        {failedSource === source ? (
          <span className="sprite-unavailable">Image unavailable</span>
        ) : (
          <Image
            src={source}
            alt=""
            width={96}
            height={96}
            className="sprite pokemon-sprite"
            loading="lazy"
            unoptimized
            onError={() => setFailedSource(source)}
          />
        )}
      </span>
      <span className="pokemon-name">{pokemon.name}</span>
      <span className="pokemon-status">
        {pending ? (
          <Spinner className="size-3.5" />
        ) : (
          <Icon name={caught ? 'check' : onToggle ? 'plus' : 'target'} />
        )}
        <span>
          {pending
            ? 'Saving…'
            : caught
              ? 'Shiny caught'
              : onToggle
                ? 'Mark shiny'
                : 'Not caught'}
        </span>
      </span>
    </>
  )
  return (
    <li className={`pokemon-card ${caught ? 'is-caught' : ''}`}>
      {onToggle ? (
        <button
          type="button"
          className="pokemon-card-inner"
          onClick={() => onToggle(pokemon.id)}
          disabled={pending}
          aria-pressed={caught}
          aria-label={`${caught ? 'Unmark' : 'Mark'} ${pokemon.name} as shiny`}
          aria-busy={pending}
        >
          {content}
        </button>
      ) : (
        <div
          className="pokemon-card-inner"
          aria-label={`${pokemon.name}: ${caught ? 'shiny caught' : 'not caught'}`}
        >
          {content}
        </div>
      )}
    </li>
  )
})
