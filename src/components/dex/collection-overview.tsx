import { Icon } from '@/components/icon'
import type { GenerationView } from '@/hooks/use-dex'
import { TOTAL_POKEMON } from '@/lib/gens'

export function CollectionOverview({
  caughtCount,
  generations,
  loading = false,
}: {
  caughtCount: number
  generations: readonly GenerationView[]
  loading?: boolean
}) {
  const percent = (caughtCount / TOTAL_POKEMON) * 100
  const complete = generations.filter((g) => g.have === g.total).length
  return (
    <section
      className="collection-overview"
      aria-label="Collection progress"
      aria-busy={loading}
    >
      <div className="overview-main">
        <div className="stat-label">
          <Icon name="sparkles" />
          <span>Shinies collected</span>
          <span className="stat-percent">
            {loading ? '—' : `${percent.toFixed(1)}%`} complete
          </span>
        </div>
        <p className="stat-value">
          {loading ? '—' : caughtCount.toLocaleString()}
          <span>/ {TOTAL_POKEMON.toLocaleString()}</span>
        </p>
      </div>
      <div className="overview-stat">
        <div className="stat-label">
          <Icon name="target" />
          <span>Still to discover</span>
        </div>
        <p className="stat-value">
          {loading ? '—' : (TOTAL_POKEMON - caughtCount).toLocaleString()}
        </p>
      </div>
      <div className="overview-stat">
        <div className="stat-label">
          <Icon name="trophy" />
          <span>Regions complete</span>
        </div>
        <p className="stat-value">
          {loading ? '—' : String(complete).padStart(2, '0')}
          <span>/ {String(generations.length).padStart(2, '0')}</span>
        </p>
      </div>
    </section>
  )
}
