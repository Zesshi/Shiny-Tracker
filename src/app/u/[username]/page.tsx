'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { useDex } from '@/hooks/use-dex'
import { DexToolbar } from '@/components/dex/dex-toolbar'
import { DexList } from '@/components/dex/dex-list'
import { CollectionOverview } from '@/components/dex/collection-overview'
import { Icon } from '@/components/icon'
import { GenerationSectionSkeleton } from '@/components/dex/generation-section'
import { dataErrorMessage } from '@/lib/errors'
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

    const { data: rows, error: catchesError } = await supabase
      .from('catches')
      .select('user_id,pokemon_id,caught_shiny')
      .eq('user_id', profile.id)
      .returns<Catch[]>()

    // A private dex normally returns no rows under RLS. A request failure
    // must not look like a successfully loaded, empty collection.
    if (catchesError) {
      setCatches([])
      setState({
        kind: 'error',
        message: dataErrorMessage(
          catchesError,
          'We could not load this collection. Please try again.',
          'profile',
        ),
      })
    } else {
      setCatches(rows ?? [])
      setState({ kind: 'ready', profile })
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

  return (
    <div className="page-container">
      <div className="page-heading profile-heading">
        <div className="profile-identity">
          <div className="profile-avatar" aria-hidden="true">
            {profile.username?.[0]?.toUpperCase() ?? 'T'}
          </div>
          <div>
            <p className="eyebrow">TRAINER FIELD JOURNAL</p>
            <h1>@{profile.username}</h1>
            <p>
              {locked
                ? 'This trainer keeps their collection private.'
                : 'A collection of one-in-thousands moments.'}
            </p>
          </div>
        </div>
        <div className="profile-actions">
          <>
            {!profile.is_public && (
              <Badge tone="neutral">
                {isOwner ? 'Private' : 'Private profile'}
              </Badge>
            )}
            {profile.is_public && (
              <span className="quiet-badge">
                <Icon name="globe" />
                Public collection
              </span>
            )}
            {isOwner && (
              <LinkButton href="/" variant="secondary" size="sm">
                Manage my dex
              </LinkButton>
            )}
          </>
        </div>
      </div>

      {locked ? (
        <Card padding="lg" className="mb-12">
          <Icon name="lock" className="mb-4 text-ink-subtle" />
          <p className="text-sm text-ink-muted">
            @{profile.username} has not made their shiny dex public.
          </p>
        </Card>
      ) : (
        <>
          <CollectionOverview
            caughtCount={dex.caughtCount}
            generations={dex.generations}
          />

          <DexToolbar
            filter={dex.filter}
            onFilterChange={dex.setFilter}
            query={dex.query}
            onQueryChange={dex.setQuery}
            totalMatches={dex.totalMatches}
            isFiltering={dex.isFiltering}
            caughtCount={dex.caughtCount}
          />

          <div className="pb-12">
            {/* Read-only: no onTogglePokemon, so cards render as status chips. */}
            <DexList
              generations={dex.generations}
              toggleGen={dex.toggleGen}
              isCaught={dex.isCaught}
              isFiltering={dex.isFiltering}
              totalMatches={dex.totalMatches}
              onReset={() => {
                dex.setQuery('')
                dex.setFilter('all')
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
