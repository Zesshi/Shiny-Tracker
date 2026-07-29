'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRequireAuth } from '@/components/auth-provider'
import { useDex } from '@/hooks/use-dex'
import { DexToolbar } from '@/components/dex/dex-toolbar'
import { DexList } from '@/components/dex/dex-list'
import { GenerationSectionSkeleton } from '@/components/dex/generation-section'
import { enqueue, flushQueue, listenOnline } from '@/lib/offline-queue'
import { dataErrorMessage } from '@/lib/errors'
import { TOTAL_POKEMON } from '@/lib/gens'
import type { Catch } from '@/lib/types'
import {
  Alert,
  Badge,
  Button,
  Container,
  ErrorState,
  PageHeader,
  PageLoading,
  Progress,
} from '@/components/ui'

export default function Home() {
  const { status, user } = useRequireAuth()
  const userId = user?.id

  const [catches, setCatches] = useState<Catch[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [writeNotice, setWriteNotice] = useState<string | null>(null)

  /* --- Load my catches (one request per page load, unchanged) ----------- */
  const loadCatches = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setLoadError(null)

    const { data, error } = await supabase
      .from('catches')
      .select('user_id,pokemon_id,caught_shiny')
      .eq('user_id', userId)
      .returns<Catch[]>()

    if (error) {
      setLoadError(dataErrorMessage(error, 'We could not load your shiny dex.', 'dex'))
    } else {
      setCatches(data ?? [])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void loadCatches()
  }, [loadCatches])

  /* --- Flush anything queued while offline ------------------------------ */
  useEffect(() => {
    if (!userId) return
    void flushQueue(supabase, userId).catch(() => {})
    return listenOnline(supabase, userId)
  }, [userId])

  const dex = useDex(catches)

  /* --- Toggle a shiny --------------------------------------------------- */
  const toggleMine = useCallback(
    async (pokemonId: number) => {
      if (!userId) return
      setWriteNotice(null)

      const existing = catches.find(
        c => c.user_id === userId && c.pokemon_id === pokemonId,
      )

      // Optimistic update first so the grid responds immediately.
      const previous = catches
      const nextCaught = !existing?.caught_shiny
      setCatches(prev =>
        nextCaught
          ? existing
            ? prev.map(c =>
                c.user_id === userId && c.pokemon_id === pokemonId
                  ? { ...c, caught_shiny: true }
                  : c,
              )
            : [...prev, { user_id: userId, pokemon_id: pokemonId, caught_shiny: true }]
          : prev.filter(
              c => !(c.user_id === userId && c.pokemon_id === pokemonId),
            ),
      )

      const { error } = existing?.caught_shiny
        ? await supabase
            .from('catches')
            .delete()
            .eq('user_id', userId)
            .eq('pokemon_id', pokemonId)
        : existing
          ? await supabase
              .from('catches')
              .update({ caught_shiny: true })
              .eq('user_id', userId)
              .eq('pokemon_id', pokemonId)
          : await supabase
              .from('catches')
              .insert({ user_id: userId, pokemon_id: pokemonId, caught_shiny: true })

      if (!error) return

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        // Offline: keep the optimistic state and let the existing queue
        // reconcile it when the connection comes back.
        enqueue(pokemonId, nextCaught)
        setWriteNotice(
          'You are offline. This change is saved on your device and will sync automatically.',
        )
        return
      }

      setCatches(previous)
      setWriteNotice(
        dataErrorMessage(error, 'That change could not be saved. Please try again.', 'dex'),
      )
    },
    [catches, userId],
  )

  /* --- Render ----------------------------------------------------------- */
  if (status !== 'authenticated') {
    return (
      <Container>
        <PageLoading label="Checking your session" />
      </Container>
    )
  }

  const pct = Math.round((dex.caughtCount / TOTAL_POKEMON) * 100)

  return (
    <Container>
      <PageHeader
        title="Your shiny dex"
        description={`${dex.caughtCount} of ${TOTAL_POKEMON} shinies caught — ${pct}% complete.`}
        actions={
          <Badge tone={dex.caughtCount > 0 ? 'shine' : 'neutral'}>
            {dex.caughtCount}/{TOTAL_POKEMON}
          </Badge>
        }
      />

      <Progress
        value={dex.caughtCount}
        max={TOTAL_POKEMON}
        tone="shine"
        label={`Overall completion: ${dex.caughtCount} of ${TOTAL_POKEMON}`}
        className="mb-5"
      />

      <DexToolbar
        filter={dex.filter}
        onFilterChange={dex.setFilter}
        query={dex.query}
        onQueryChange={dex.setQuery}
        totalMatches={dex.totalMatches}
        isFiltering={dex.isFiltering}
      />

      {writeNotice && (
        <Alert tone="warning" className="mb-4">
          {writeNotice}
        </Alert>
      )}

      <div className="pb-12">
        {loadError ? (
          <ErrorState
            description={loadError}
            action={
              <Button variant="secondary" onClick={() => void loadCatches()}>
                Try again
              </Button>
            }
          />
        ) : loading ? (
          <>
            <span className="sr-only" role="status">
              Loading your shiny dex…
            </span>
            {Array.from({ length: 4 }, (_, i) => (
              <GenerationSectionSkeleton key={i} />
            ))}
          </>
        ) : (
          <DexList
            generations={dex.generations}
            toggleGen={dex.toggleGen}
            isCaught={dex.isCaught}
            isFiltering={dex.isFiltering}
            totalMatches={dex.totalMatches}
            onTogglePokemon={toggleMine}
          />
        )}
      </div>
    </Container>
  )
}
