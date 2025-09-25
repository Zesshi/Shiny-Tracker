'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import data from '@/data/pokemon.json'
import { GENS } from '@/lib/gens'
import { spriteUrl } from '@/lib/sprites'

type Pokemon = { id: number; name: string; sprite: string }
type Catch = { user_id: string; pokemon_id: number; caught_shiny: boolean }
type User = { id: string; email: string | null }
type Profile = { id: string; username: string; is_public: boolean }
type Filter = 'all' | 'caught' | 'missing'

export default function PublicProfile() {
  const params = useParams<{ username: string }>()
  const uname = String(params.username || '').toLowerCase()

  const [viewer, setViewer] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [catches, setCatches] = useState<Catch[]>([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  // gen1 open by default (stable)
  const defaultOpen = useMemo(
    () => Object.fromEntries(GENS.map(g => [g.key, g.key === 'gen1'])) as Record<string, boolean>,
    []
  )
  const [open, setOpen] = useState<Record<string, boolean>>(() => defaultOpen)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setViewer({ id: data.user.id, email: data.user.email ?? null })
    })
  }, [])

  useEffect(() => {
    if (!uname) return
      ; (async () => {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id,username,is_public')
          .ilike('username', uname)
          .maybeSingle()
          .returns<Profile>()
        if (!prof) { setProfile(null); return }
        setProfile(prof)

        const { data: cats } = await supabase
          .from('catches')
          .select('user_id,pokemon_id,caught_shiny')
          .eq('user_id', prof.id)
          .returns<Catch[]>()
        setCatches(cats || [])
      })()
  }, [uname])

  const isOwner = viewer?.id === profile?.id

  const status = useCallback(
    (pokeId: number) => catches.some(c => c.pokemon_id === pokeId && c.caught_shiny),
    [catches]
  )

  const caughtCount = useMemo(
    () => catches.filter(c => c.caught_shiny).length,
    [catches]
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data as Pokemon[]).filter(p => {
      const has = status(p.id)
      const byFilter = filter === 'all' ? true : filter === 'caught' ? has : !has
      const bySearch =
        !needle || p.name.toLowerCase().includes(needle) || p.id.toString() === needle.replace('#', '')
      return byFilter && bySearch
    })
  }, [q, filter, status])

  // matches in CURRENT filtered list (for auto-open)
  const matchesByGen = useMemo(() => {
    const m: Record<string, number> =
      Object.fromEntries(GENS.map(g => [g.key, 0])) as Record<string, number>
    for (const p of filtered) {
      const g = GENS.find(gg => p.id >= gg.start && p.id <= gg.end)
      if (g) m[g.key]++
    }
    return m
  }, [filtered])

  // overall per-gen progress (for banner tint + counts)
  const haveByGen = useMemo(() => {
    const m = Object.fromEntries(GENS.map(g => [g.key, 0])) as Record<string, number>
    for (const c of catches) {
      if (!c.caught_shiny) continue
      const g = GENS.find(gg => c.pokemon_id >= gg.start && c.pokemon_id <= gg.end)
      if (g) m[g.key]++
    }
    return m
  }, [catches])

  // auto-open gens with matches when searching
  useEffect(() => {
    const hasQuery = q.trim() !== ''
    if (!hasQuery) return
    setOpen(() => {
      const next: Record<string, boolean> = {}
      for (const g of GENS) next[g.key] = matchesByGen[g.key] > 0
      return next
    })
  }, [q, matchesByGen])

  // reset to default when search cleared
  useEffect(() => {
    if (q.trim() === '') setOpen(defaultOpen)
  }, [q, defaultOpen])

  // 404
  if (profile === null) {
    return (
      <main className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="mt-2">Go back to <Link href="/" className="underline">home</Link>.</p>
      </main>
    )
  }

  // privacy gate (optional but nice): hide grid if private & not owner
  const locked = !profile.is_public && !isOwner

  return (
    <main className="max-w-7xl mx-auto p-4">
      <header className="toolbar mb-4">
        {/* left: title */}
        <div><h1 className="text-2xl font-bold">@{profile.username}</h1></div>

        {/* center: filter + search */}
        <div className="center">
          <select
            className="border p-1"
            value={filter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value as Filter)}
          >
            <option value="all">All</option>
            <option value="missing">Missing</option>
            <option value="caught">Caught</option>
          </select>
          <input
            className="border p-1"
            placeholder="Search name or #id"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* right: pills */}
        <div className="right">
          <span className="pill">{caughtCount}/1025 caught</span>
          {!profile.is_public && !isOwner && (<span className="pill">Private</span>)}
          {isOwner && (<Link href="/settings" className="pill">Edit profile</Link>)}
        </div>
      </header>

      {locked ? (
        <div className="card">
          <p className="text-sm">This profile is private.</p>
        </div>
      ) : (
        GENS.map(g => {
          const mons = filtered.filter(p => p.id >= g.start && p.id <= g.end)
          const total = g.end - g.start + 1
          const have = haveByGen[g.key] || 0
          const pct = have / total
          const bannerClass =
            pct >= 1 ? 'gen-rainbow' :
              pct >= 0.75 ? 'gen-gold' :
                pct >= 0.50 ? 'gen-silver' :
                  pct >= 0.25 ? 'gen-bronze' :
                    ''

          return (
            <section key={g.key} className="gen-section">
              <button className={`gen-header ${bannerClass}`} onClick={() => setOpen(prev => ({ ...prev, [g.key]: !prev[g.key] }))}>
                <svg className={`chev ${open[g.key] ? 'open' : ''}`} viewBox="0 0 24 24" fill="none">
                  <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="gen-title">{g.name}</span>
                <span className="pill" style={{ marginLeft: 'auto' }}>{have}/{total}</span>
              </button>

              {open[g.key] && (
                <ul className="poke-grid">
                  {mons.map(p => {
                    const has = status(p.id)
                    return (
                      <li key={p.id} className={`poke-card flex flex-col items-center justify-between ${has ? 'shine' : ''}`}>
                        <div className="w-full flex items-center justify-between mb-1">
                          <span className="text-[11px] font-medium opacity-80">#{p.id.toString().padStart(4, '0')}</span>
                          <span title="Owner" className={`w-2.5 h-2.5 rounded-full ${has ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </div>
                        <div className="flex justify-center items-center h-20">
                          <Image
                            src={spriteUrl(p.id, has)}
                            alt={p.name}
                            width={72}
                            height={72}
                            className="poke-sprite"
                            loading="lazy"
                            unoptimized
                          />
                        </div>
                        <div className="text-center text-[11px] mt-1">{p.name}</div>

                        {isOwner ? (
                          // keep as view-only here; edit on Home (or swap to an inline toggle if you prefer)
                          <Link href="/" className="mt-2 w-full btn btn-tonal text-center">Manage on Home</Link>
                        ) : (
                          <div className={`mt-2 w-full btn ${has ? 'btn-primary' : 'btn-tonal'} text-center`}>
                            {has ? 'Shiny caught' : 'Missing'}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })
      )}
    </main>
  )
}
