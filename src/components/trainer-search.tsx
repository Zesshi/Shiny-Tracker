'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { Badge, Input, Spinner } from '@/components/ui'
import type { TrainerSummary } from '@/lib/types'

const SearchIcon = (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-current">
    <path d="M7 1.5a5.5 5.5 0 1 0 3.37 9.85l3.14 3.14a.75.75 0 1 0 1.06-1.06l-3.14-3.14A5.5 5.5 0 0 0 7 1.5Zm-4 5.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" />
  </svg>
)

export type TrainerSearchProps = {
  /** Max rows requested from Supabase. */
  limit?: number
  /** 'popover' floats results over the page; 'inline' renders them in flow. */
  layout?: 'popover' | 'inline'
  className?: string
  autoFocus?: boolean
}

/**
 * Trainer lookup by username.
 *
 * Request behaviour is unchanged from the original implementations: a 250 ms
 * debounce, an empty query issues no request at all, and the same
 * `ilike('username', '%needle%')` with a row limit. Two additions, neither of
 * which changes request volume:
 *   - stale responses are discarded, so fast typing can no longer paint an
 *     out-of-order result set
 *   - errors surface instead of being silently swallowed
 */
export function TrainerSearch({
  limit = 10,
  layout = 'popover',
  className,
  autoFocus,
}: TrainerSearchProps) {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<TrainerSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) {
      setRows([])
      setLoading(false)
      setFailed(false)
      return
    }

    let active = true
    setLoading(true)

    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username,is_public')
        .ilike('username', `%${needle}%`)
        .limit(limit)
        .returns<TrainerSummary[]>()

      if (!active) return
      if (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[trainer-search]', error)
        }
        setFailed(true)
        setRows([])
      } else {
        setFailed(false)
        setRows(data ?? [])
      }
      setLoading(false)
      setOpen(true)
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, limit])

  // Dismiss the popover on outside click / Escape.
  useEffect(() => {
    if (layout !== 'popover' || !open) return
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [layout, open])

  const hasQuery = query.trim() !== ''
  const showResults = layout === 'inline' ? hasQuery : open && hasQuery

  const results = (
    <>
      {failed ? (
        <p className="px-3 py-3 text-sm text-danger">
          Could not search right now. Check your connection and try again.
        </p>
      ) : rows.length === 0 && !loading ? (
        <p className="px-3 py-3 text-sm text-ink-muted">
          No trainer matches “{query.trim()}”.
        </p>
      ) : (
        <ul className="list-none">
          {rows.map(row => (
            <li key={row.username}>
              <Link
                href={`/u/${row.username}`}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2.5 text-sm',
                  'text-ink transition-colors duration-(--transition-fast)',
                  'hover:bg-surface-hover focus-visible:bg-surface-hover',
                  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-hover',
                )}
              >
                <span className="truncate">@{row.username}</span>
                {!row.is_public && <Badge tone="neutral">Private</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Input
        label="Find a trainer by username"
        hideLabel
        type="search"
        placeholder="Find @username"
        value={query}
        autoFocus={autoFocus}
        onChange={e => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        leading={
          loading ? <Spinner className="size-4" /> : SearchIcon
        }
        aria-controls={listId}
        aria-expanded={showResults}
      />

      <div
        id={listId}
        role="status"
        aria-live="polite"
        className={cn(
          !showResults && 'hidden',
          layout === 'popover'
            ? 'absolute top-full right-0 z-50 mt-2 max-h-80 w-72 overflow-auto rounded-lg border border-line bg-surface shadow-lg'
            : 'mt-3 overflow-hidden rounded-lg border border-line bg-surface',
        )}
      >
        {showResults && results}
      </div>
    </div>
  )
}
