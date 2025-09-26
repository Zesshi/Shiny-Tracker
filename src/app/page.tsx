'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import data from '@/data/pokemon.json'
import { GENS } from '@/lib/gens'
import { flushQueue, listenOnline } from '@/lib/offline-queue'
import { spriteUrl } from '@/lib/sprites'
import type { CSSProperties } from 'react'

type Pokemon = { id: number; name: string; sprite: string }
type Catch = { user_id: string; pokemon_id: number; caught_shiny: boolean }
type User = { id: string; email: string | null }
type Filter = 'all' | 'mine-missing' | 'mine-caught'
type TrainerRow = { username: string; is_public: boolean }
type GenStyle = CSSProperties & { ['--gen-bg']?: string }

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [catches, setCatches] = useState<Catch[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [trainerQ, setTrainerQ] = useState('')
  const [trainerRows, setTrainerRows] = useState<TrainerRow[]>([])

  // gen1 open by default (stable object)
  const defaultOpen = useMemo(
    () => Object.fromEntries(GENS.map(g => [g.key, g.key === 'gen1'])) as Record<string, boolean>,
    []
  )
  const [open, setOpen] = useState<Record<string, boolean>>(() => defaultOpen)

  // auth + my catches
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      setUser({ id: data.user.id, email: data.user.email ?? null })
      const { data: cats } = await supabase
        .from('catches')
        .select('user_id,pokemon_id,caught_shiny')
        .eq('user_id', data.user.id)
        .returns<Catch[]>()
      setCatches(cats || [])
    })
  }, [])

  // flush any offline queue, and listen for online to re-flush
  useEffect(() => {
    if (!user) return
    // no need for async cleanup here
    flushQueue(supabase, user.id).catch(() => { })
    const un = listenOnline(supabase, user.id)
    return un
  }, [user])

  // trainer search (right side)
  useEffect(() => {
    const id = setTimeout(async () => {
      const needle = trainerQ.trim().toLowerCase()
      if (!needle) { setTrainerRows([]); return }
      const { data } = await supabase
        .from('profiles')
        .select('username,is_public')
        .ilike('username', `%${needle}%`)
        .limit(10)
        .returns<TrainerRow[]>()
      setTrainerRows(data || [])
    }, 250)
    return () => clearTimeout(id)
  }, [trainerQ])

  const status = useCallback((pokeId: number) => {
    return catches.some(c => c.pokemon_id === pokeId && c.caught_shiny)
  }, [catches])

  async function toggleMine(pokemon_id: number) {
    if (!user) return
    const mine = catches.find(c => c.user_id === user.id && c.pokemon_id === pokemon_id)

    if (mine?.caught_shiny) {
      await supabase.from('catches').delete().eq('user_id', user.id).eq('pokemon_id', pokemon_id)
      setCatches(prev => prev.filter(c => !(c.user_id === user.id && c.pokemon_id === pokemon_id)))
    } else if (mine) {
      const { data } = await supabase
        .from('catches')
        .update({ caught_shiny: true })
        .eq('user_id', user.id)
        .eq('pokemon_id', pokemon_id)
        .select()
        .returns<Catch[]>()
      if (data && data[0]) {
        setCatches(prev => prev.map(c =>
          c.user_id === user.id && c.pokemon_id === pokemon_id ? data[0] : c
        ))
      }
    } else {
      const { data } = await supabase
        .from('catches')
        .insert({ user_id: user.id, pokemon_id, caught_shiny: true })
        .select()
        .returns<Catch[]>()
      if (data && data[0]) setCatches(prev => [...prev, data[0]])
    }
  }

  // base filter (by my caught/missing + name/#)
  const filtered: Pokemon[] = useMemo(() => {
    const list = data as Pokemon[]
    const needle = q.trim().toLowerCase()
    return list.filter(p => {
      const mine = status(p.id)
      const passesFilter =
        filter === 'all' ? true : filter === 'mine-missing' ? !mine : mine
      const passesSearch =
        !needle || p.name.toLowerCase().includes(needle) || p.id.toString() === needle.replace('#', '')
      return passesFilter && passesSearch
    })
  }, [status, filter, q])

  // Count matches per generation in the CURRENT filtered list
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

  // when search cleared, reset to default (Gen 1 open)
  useEffect(() => {
    if (q.trim() === '') setOpen(defaultOpen)
  }, [q, defaultOpen])

  const mineCount = catches.length
  const toggle = (k: string) => setOpen(prev => ({ ...prev, [k]: !prev[k] }))

  return (
    <main className="max-w-7xl mx-auto p-4">
      <header className="toolbar mb-4">
        {/* left: title */}
        <div><h1 className="text-2xl font-bold">Your Shinies ({mineCount}/1025)</h1></div>

        {/* center: filter + pokemon search (centered) */}
        <div className="center">
          <select
            className="border p-1"
            value={filter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value as Filter)}
          >
            <option value="all">All</option>
            <option value="mine-missing">Missing</option>
            <option value="mine-caught">Caught</option>
          </select>
          <input
            className="border p-1"
            placeholder="Search name or #id"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* right: trainer search (pushed all the way right) */}
        <div className="right">
          <div className="relative">
            <input
              className="border p-1"
              placeholder="Find @username"
              value={trainerQ}
              onChange={(e) => setTrainerQ(e.target.value)}
            />
            {trainerRows.length > 0 && (
              <div className="results-panel">
                {trainerRows.map(r => (
                  <Link key={r.username} href={`/u/${r.username}`} className="result-item">
                    @{r.username}
                    {!r.is_public && <span className="private">private</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* accordion per generation */}
      {GENS.map(g => {
        const sectionStyle: GenStyle = { ['--gen-bg']: `url('/gen/${g.key}.jpg')` }
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
          <section
            key={g.key}
            className="gen-section"
            style={sectionStyle}
          >
            <button className={`gen-header ${bannerClass}`} onClick={() => toggle(g.key)}>
              <svg className={`chev ${open[g.key] ? 'open' : ''}`} viewBox="0 0 24 24" fill="none">
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="gen-title">{g.name}</span>
              <span className="gen-numbers">{g.start} - {g.end}</span>
              <span className="pill" style={{ marginLeft: 'auto' }}>{have}/{total}</span>
            </button>

            {open[g.key] && (
              <ul className="poke-grid">
                {mons.map(p => {
                  const mine = status(p.id)
                  return (
                    <li key={p.id} className={`poke-card flex flex-col items-center justify-between ${mine ? 'shine' : ''}`}>
                      <div className="w-full flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium opacity-80">#{p.id.toString().padStart(4, '0')}</span>
                        <span title="You" className={`w-2.5 h-2.5 rounded-full ${mine ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </div>
                      <div className="flex justify-center items-center h-20">
                        <Image
                          src={spriteUrl(p.id, mine)}
                          alt={p.name}
                          width={72}
                          height={72}
                          className="poke-sprite"
                          loading="lazy"
                          unoptimized
                        />
                      </div>
                      <div className="text-center text-[11px] mt-1">{p.name}</div>
                      <button onClick={() => toggleMine(p.id)} className={`mt-2 w-full btn ${mine ? 'btn-primary' : 'btn-tonal'}`}>
                        {mine ? 'Shiny caught' : 'Mark shiny'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </main>
  )
}
