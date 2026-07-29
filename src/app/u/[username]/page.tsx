'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { useDex } from '@/hooks/use-dex'
import { DexToolbar } from '@/components/dex/dex-toolbar'
import { DexList } from '@/components/dex/dex-list'
import { GenerationSectionSkeleton } from '@/components/dex/generation-section'
import { dataErrorMessage } from '@/lib/errors'
import { TOTAL_POKEMON } from '@/lib/gens'
import type { Catch, Profile } from '@/lib/types'
import {
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  ErrorState,
  LinkButton,
  PageHeader,
  Progress,
} from '@/components/ui'

type PublicProfile = Pick<Profile, 'id' | 'username' | 'is_public'>

type LoadState =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; profile: PublicProfile }

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>()
  const uname = String(params?.username ?? '').toLowerCase()

  // Viewer identity comes from the shared auth context — no extra request.
  const { user: viewer } = useAuth()

  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [catches, setCatches] = useState<Catch[]>([])

  const load = useCallback(async () => {
    if (!uname) return
    setState({ kind: 'loading' })

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,username,is_public')
      .ilike('username', uname)
      .maybeSingle<PublicProfile>()

    if (profileError) {
      setState({
        kind: 'error',
        message: dataErrorMessage(
          profileError,
          'We could not load this trainer.',
          'profile',
        ),
      })
      return
    }
    if (!profile) {
      setState({ kind: 'missing' })
      return
    }

    setState({ kind: 'ready', profile })

    const { data: rows, error: catchesError } = await supabase
      .from('catches')
      .select('user_id,pokemon_id,caught_shiny')
      .eq('user_id', profile.id)
      .returns<Catch[]>()

    // A private dex returns no rows under RLS rather than an error; either way
    // an empty list is a valid state, so this never blocks the page.
    if (catchesError) {
      dataErrorMessage(catchesError, '', 'profile')
      setCatches([])
    } else {
      setCatches(rows ?? [])
    }
  }, [uname])

  useEffect(() => {
    void load()
  }, [load])

  const dex = useDex(catches)

  /* --- Not found / error ------------------------------------------------ */
  if (state.kind === 'missing') {
    return (
      <Container width="md">
        <PageHeader title="Trainer not found" />
        <EmptyState
          title={`No trainer named @${uname}`}
          description="Check the spelling, or search for another trainer."
          action={
            <LinkButton href="/search" variant="primary">
              Find trainers
            </LinkButton>
          }
        />
      </Container>
    )
  }

  if (state.kind === 'error') {
    return (
      <Container width="md">
        <PageHeader title="Trainer" />
        <ErrorState
          description={state.message}
          action={
            <Button variant="secondary" onClick={() => void load()}>
              Try again
            </Button>
          }
        />
      </Container>
    )
  }

  if (state.kind === 'loading') {
    return (
      <Container>
        <PageHeader title="Loading trainer…" />
        <span className="sr-only" role="status">
          Loading trainer profile…
        </span>
        {Array.from({ length: 4 }, (_, i) => (
          <GenerationSectionSkeleton key={i} />
        ))}
      </Container>
    )
  }

  /* --- Ready ------------------------------------------------------------ */
  const { profile } = state
  const isOwner = viewer?.id === profile.id
  const locked = !profile.is_public && !isOwner
  const pct = Math.round((dex.caughtCount / TOTAL_POKEMON) * 100)

  return (
    <Container>
      <PageHeader
        title={`@${profile.username}`}
        description={
          locked
            ? 'This trainer keeps their dex private.'
            : `${dex.caughtCount} of ${TOTAL_POKEMON} shinies caught — ${pct}% complete.`
        }
        actions={
          <>
            {!profile.is_public && (
              <Badge tone="neutral">{isOwner ? 'Private' : 'Private profile'}</Badge>
            )}
            {!locked && (
              <Badge tone={dex.caughtCount > 0 ? 'shine' : 'neutral'}>
                {dex.caughtCount}/{TOTAL_POKEMON}
              </Badge>
            )}
            {isOwner && (
              <LinkButton href="/" variant="secondary" size="sm">
                Manage my dex
              </LinkButton>
            )}
          </>
        }
      />

      {locked ? (
        <Card padding="lg" className="mb-12">
          <p className="text-sm text-ink-muted">
            @{profile.username} has not made their shiny dex public.
          </p>
        </Card>
      ) : (
        <>
          <Progress
            value={dex.caughtCount}
            max={TOTAL_POKEMON}
            tone="shine"
            label={`Completion: ${dex.caughtCount} of ${TOTAL_POKEMON}`}
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

          <div className="pb-12">
            {/* Read-only: no onTogglePokemon, so cards render as status chips. */}
            <DexList
              generations={dex.generations}
              toggleGen={dex.toggleGen}
              isCaught={dex.isCaught}
              isFiltering={dex.isFiltering}
              totalMatches={dex.totalMatches}
            />
          </div>
        </>
      )}
    </Container>
  )
}
