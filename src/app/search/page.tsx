'use client'

import { TrainerSearch } from '@/components/trainer-search'
import { Icon } from '@/components/icon'

/**
 * Full-page trainer lookup.
 *
 * Shares TrainerSearch with the header, so the debounce, row limit and query
 * shape are defined once. Kept at the original 20-row limit.
 */
export default function SearchPage() {
  return (
    <div className="page-container discover-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE TRAINER COMMUNITY</p>
          <h1>
            A shared love of rare finds<span className="text-brand">.</span>
          </h1>
          <p>
            Find a trainer. Explore their collection. Get inspired for your next
            hunt.
          </p>
        </div>
      </div>
      <section className="trainer-search-panel" aria-label="Trainer search">
        <div className="search-panel-heading">
          <span className="section-icon">
            <Icon name="users" />
          </span>
          <div>
            <h2>Discover trainers</h2>
            <p>Search for a username to see their shiny dex.</p>
          </div>
        </div>
        <TrainerSearch limit={20} layout="inline" autoFocus />
      </section>
      <p className="discover-privacy">
        <Icon name="lock" />
        Every trainer chooses what to share. Private collections stay private.
      </p>
    </div>
  )
}
