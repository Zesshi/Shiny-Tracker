'use client'
import { useMemo } from 'react'
import { GENS } from '@/lib/gens'

type Catch = { user_id: string; pokemon_id: number; caught_shiny: boolean }

export default function Stats({ catches }: { catches: Catch[] }) {
  const total = catches.length
  const perGen = useMemo(() => {
    const map = new Map<string, number>()
    for (const g of GENS) map.set(g.key, 0)
    for (const c of catches) {
      if (!c.caught_shiny) continue
      const g = GENS.find(gg => c.pokemon_id >= gg.start && c.pokemon_id <= gg.end)
      if (g) map.set(g.key, (map.get(g.key) || 0) + 1)
    }
    return map
  }, [catches])

  return (
    <div className="flex flex-wrap gap-2">
      <span className="pill">Total {total}/1025</span>
      {GENS.map(g => (
        <span key={g.key} className="pill">
          {g.name.split('•')[0].trim()}: {perGen.get(g.key) || 0}/{g.end - g.start + 1}
        </span>
      ))}
    </div>
  )
}
