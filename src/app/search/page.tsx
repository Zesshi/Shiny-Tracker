'use client'

import { Container, PageHeader } from '@/components/ui'
import { TrainerSearch } from '@/components/trainer-search'

/**
 * Full-page trainer lookup.
 *
 * Shares TrainerSearch with the header, so the debounce, row limit and query
 * shape are defined once. Kept at the original 20-row limit.
 */
export default function SearchPage() {
  return (
    <Container width="md">
      <PageHeader
        title="Find trainers"
        description="Search by username to view another trainer's shiny dex."
      />
      <div className="pb-12">
        <TrainerSearch limit={20} layout="inline" autoFocus />
      </div>
    </Container>
  )
}
