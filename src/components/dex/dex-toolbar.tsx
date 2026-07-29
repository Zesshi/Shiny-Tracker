'use client'

import { Input, Select } from '@/components/ui'
import { DEX_FILTER_OPTIONS, type DexFilter } from '@/hooks/use-dex'

export type DexToolbarProps = {
  filter: DexFilter
  onFilterChange: (filter: DexFilter) => void
  query: string
  onQueryChange: (query: string) => void
  /** Number of entries matching the current filter + search. */
  totalMatches: number
  isFiltering: boolean
}

const SearchIcon = (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-current">
    <path d="M7 1.5a5.5 5.5 0 1 0 3.37 9.85l3.14 3.14a.75.75 0 1 0 1.06-1.06l-3.14-3.14A5.5 5.5 0 0 0 7 1.5Zm-4 5.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" />
  </svg>
)

/**
 * Filter + search controls for a dex view. Purely local state — changing
 * either never triggers a network request.
 */
export function DexToolbar({
  filter,
  onFilterChange,
  query,
  onQueryChange,
  totalMatches,
  isFiltering,
}: DexToolbarProps) {
  return (
    <div className="sticky top-(--sticky-offset) z-30 -mx-4 mb-4 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select<DexFilter>
          label="Filter by status"
          hideLabel
          value={filter}
          onChange={e => onFilterChange(e.target.value as DexFilter)}
          options={DEX_FILTER_OPTIONS}
          selectSize="md"
          fieldClassName="sm:w-40"
        />
        <Input
          label="Search Pokémon by name or dex number"
          hideLabel
          type="search"
          placeholder="Search name or #id"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          leading={SearchIcon}
          fieldClassName="flex-1"
        />
      </div>

      {/* Announced politely so screen-reader users hear the result count
          change as they type, without interrupting them. */}
      <p role="status" aria-live="polite" className="sr-only">
        {isFiltering
          ? `${totalMatches} Pokémon match your search.`
          : `Showing all ${totalMatches} Pokémon.`}
      </p>
    </div>
  )
}
