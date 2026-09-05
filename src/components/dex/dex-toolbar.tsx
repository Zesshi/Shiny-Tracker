'use client'

import { Input } from '@/components/ui'
import { Icon } from '@/components/icon'
import { TOTAL_POKEMON } from '@/lib/gens'
import { type DexFilter } from '@/hooks/use-dex'

export type DexToolbarProps = {
  filter: DexFilter
  onFilterChange: (filter: DexFilter) => void
  query: string
  onQueryChange: (query: string) => void
  totalMatches: number
  isFiltering: boolean
  caughtCount?: number
}

export function DexToolbar({
  filter,
  onFilterChange,
  query,
  onQueryChange,
  totalMatches,
  isFiltering,
  caughtCount,
}: DexToolbarProps) {
  const options = [
    { value: 'all' as const, label: 'All Pokémon', count: TOTAL_POKEMON },
    { value: 'caught' as const, label: 'Caught', count: caughtCount },
    {
      value: 'missing' as const,
      label: 'Missing',
      count:
        caughtCount === undefined ? undefined : TOTAL_POKEMON - caughtCount,
    },
  ]
  return (
    <div className="dex-toolbar">
      <div className="toolbar-controls">
        <div
          className="filter-group"
          role="group"
          aria-label="Filter by catch status"
        >
          {options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              aria-pressed={filter === opt.value}
              className={`filter-option ${filter === opt.value ? 'is-active' : ''}`}
              onClick={() => onFilterChange(opt.value)}
            >
              {opt.value === 'caught' && <Icon name="sparkles" />}
              <span>{opt.label}</span>
              {opt.count !== undefined && (
                <span className="filter-count">
                  {opt.count.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>
        <Input
          label="Search Pokémon by name or dex number"
          hideLabel
          type="search"
          placeholder="Search Pokémon or #0001…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onQueryChange('')
          }}
          leading={<Icon name="search" />}
          fieldClassName="dex-search"
        />
      </div>
      {isFiltering && (
        <div className="toolbar-meta">
          <p role="status" aria-live="polite">
            <span>{totalMatches.toLocaleString()}</span> matching Pokémon
            <button
              type="button"
              onClick={() => {
                onFilterChange('all')
                onQueryChange('')
              }}
              className="reset-filter"
            >
              Clear filters <Icon name="close" />
            </button>
          </p>
        </div>
      )}
    </div>
  )
}
