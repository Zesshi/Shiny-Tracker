'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRequireAuth } from '@/components/auth-provider'
import { useDex } from '@/hooks/use-dex'
import { DexToolbar } from '@/components/dex/dex-toolbar'
import { DexList } from '@/components/dex/dex-list'
import { CollectionOverview } from '@/components/dex/collection-overview'
import { Icon } from '@/components/icon'
import { GenerationSectionSkeleton } from '@/components/dex/generation-section'
import { enqueue, flushQueue, listenOnline } from '@/lib/offline-queue'
import { dataErrorMessage } from '@/lib/errors'
import { TOTAL_POKEMON } from '@/lib/gens'
import type { Catch } from '@/lib/types'
import { Button, Container, ErrorState, PageLoading } from '@/components/ui'

export default function Home() {
  const { status, user } = useRequireAuth()
  const userId = user?.id

  const [catches, setCatches] = useState<Catch[]>([])
  const catchesRef = useRef<Catch[]>([])
  const updateCatches = useCallback(
    (update: (previous: Catch[]) => Catch[]) => {
      const next = update(catchesRef.current)
      catchesRef.current = next
      setCatches(next)
    },
    [],
  )
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [writeNotice, setWriteNotice] = useState<string | null>(null)
  const pendingRef = useRef(new Set<number>())
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(new Set())
  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!savedNotice) return
    const timer = setTimeout(() => setSavedNotice(null), 3500)
    return () => clearTimeout(timer)
  }, [savedNotice])

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
      setLoadError(
        dataErrorMessage(error, 'We could not load your shiny dex.', 'dex'),
      )
    } else {
      updateCatches(() => data ?? [])
    }
    setLoading(false)
  }, [userId, updateCatches])

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
      if (!userId || pendingRef.current.has(pokemonId)) return
      pendingRef.current.add(pokemonId)
      setPendingIds(new Set(pendingRef.current))
      setWriteNotice(null)
      setSavedNotice(null)

      const existing = catchesRef.current.find(
        (c) => c.user_id === userId && c.pokemon_id === pokemonId,
      )

      // Optimistic update first so the grid responds immediately.
      const nextCaught = !existing?.caught_shiny
      updateCatches((prev) =>
        nextCaught
          ? existing
            ? prev.map((c) =>
                c.user_id === userId && c.pokemon_id === pokemonId
                  ? { ...c, caught_shiny: true }
                  : c,
              )
            : [
                ...prev,
                { user_id: userId, pokemon_id: pokemonId, caught_shiny: true },
              ]
          : prev.filter(
              (c) => !(c.user_id === userId && c.pokemon_id === pokemonId),
            ),
      )

      try {
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
                .insert({
                  user_id: userId,
                  pokemon_id: pokemonId,
                  caught_shiny: true,
                })

        if (error) throw error
        setSavedNotice(
          nextCaught
            ? 'Shiny added to your collection.'
            : 'Pokémon removed from your shiny collection.',
        )
      } catch (error) {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          // Offline: keep the optimistic state and let the existing queue
          // reconcile it when the connection comes back.
          try {
            enqueue(pokemonId, nextCaught)
            setWriteNotice(
              'You are offline. This change is saved on your device and will sync automatically.',
            )
            return
          } catch {
            /* Device storage is unavailable: roll back below. */
          }
        }

        // Roll back this entry only; other successful writes stay intact.
        updateCatches((prev) => {
          const rest = prev.filter((c) => c.pokemon_id !== pokemonId)
          return existing ? [...rest, existing] : rest
        })
        setWriteNotice(
          dataErrorMessage(
            error,
            'That change could not be saved. Please try again.',
            'dex',
          ),
        )
      } finally {
        pendingRef.current.delete(pokemonId)
        setPendingIds(new Set(pendingRef.current))
      }
    },
    [updateCatches, userId],
  )

  /* --- Render ----------------------------------------------------------- */
  if (status !== 'authenticated') {
    return (
      <Container>
        <PageLoading label="Checking your session" />
      </Container>
    )
  }

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE NATIONAL SHINY DEX</p>
          <h1>
            My collection<span className="text-shine">.</span>
          </h1>
          <p>Every encounter. Every sparkle. All in one place.</p>
        </div>
      </div>
      {!loadError && (
        <CollectionOverview
          caughtCount={dex.caughtCount}
          generations={dex.generations}
          loading={loading}
        />
      )}

      <DexToolbar
        filter={dex.filter}
        onFilterChange={dex.setFilter}
        query={dex.query}
        onQueryChange={dex.setQuery}
        totalMatches={dex.totalMatches}
        isFiltering={dex.isFiltering}
        caughtCount={loading || loadError ? undefined : dex.caughtCount}
      />

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
            pendingIds={pendingIds}
            onReset={() => {
              dex.setQuery('')
              dex.setFilter('all')
            }}
          />
        )}
      </div>
      <div className="collection-footer">
        <span>National Pokédex · {TOTAL_POKEMON.toLocaleString()} Pokémon</span>
        <span>A collection that’s uniquely yours.</span>
      </div>
      {(writeNotice || savedNotice) && (
        <div
          className={`write-toast ${writeNotice ? 'is-warning' : ''}`}
          role={writeNotice ? 'alert' : 'status'}
        >
          <Icon name={writeNotice ? 'target' : 'check'} />
          <span>{writeNotice || savedNotice}</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => {
              setSavedNotice(null)
              setWriteNotice(null)
            }}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
    </div>
  )
}
