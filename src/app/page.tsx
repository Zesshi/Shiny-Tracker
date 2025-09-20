'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import data from '@/data/pokemon.json'

type Pokemon = { id: number; name: string; sprite: string }
type Catch = { user_id: string; pokemon_id: number; caught_shiny: boolean }
type User = { id: string; email: string | null }

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [catches, setCatches] = useState<Catch[]>([])
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'mine-missing' | 'partner-missing' | 'both-missing'>('all')
  const [q, setQ] = useState('')

  // Ensure we are logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = '/login'
      } else {
        setUser({
          id: data.user.id,
          email: data.user.email ?? null,
        })
      }
    })
  }, [])

  // Load profiles + catches
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('id,email').then(({ data }) => {
      if (data) setUsers(data as any)
    })
    supabase.from('catches').select('user_id,pokemon_id,caught_shiny').then(({ data }) => {
      if (data) setCatches(data as any)
    })
  }, [user])

  // Resolve partnerId (via pairs, fallback = first other profile)
  useEffect(() => {
    if (!user) return
    supabase.from('pairs').select('a,b').then(({ data }) => {
      const row = data?.find((r) => r.a === user.id || r.b === user.id)
      if (row) {
        setPartnerId(row.a === user.id ? row.b : row.a)
      } else {
        // fallback: just take the first other profile
        supabase.from('profiles').select('id').then(({ data }) => {
          const others = (data || []).map((d) => d.id).filter((id) => id !== user.id)
          setPartnerId(others[0] ?? null)
        })
      }
    })
  }, [user])

  const partner = useMemo(() => users.find((u) => u.id === partnerId), [users, partnerId])

  async function toggleMine(pokemon_id: number) {
    if (!user) return
    const mine = catches.find((c) => c.user_id === user.id && c.pokemon_id === pokemon_id)
    if (mine?.caught_shiny) {
      await supabase.from('catches').delete().eq('user_id', user.id).eq('pokemon_id', pokemon_id)
      setCatches((prev) => prev.filter((c) => !(c.user_id === user.id && c.pokemon_id === pokemon_id)))
    } else if (mine) {
      const { data } = await supabase
        .from('catches')
        .update({ caught_shiny: true })
        .eq('user_id', user.id)
        .eq('pokemon_id', pokemon_id)
        .select()
      if (data) setCatches((prev) => prev.map((c) => (c.user_id === user.id && c.pokemon_id === pokemon_id ? (data[0] as any) : c)))
    } else {
      const { data } = await supabase.from('catches').insert({ user_id: user.id, pokemon_id, caught_shiny: true }).select()
      if (data) setCatches((prev) => [...prev, data[0] as any])
    }
  }

  function status(pokeId: number, uid?: string) {
    return catches.some((c) => c.user_id === uid && c.pokemon_id === pokeId && c.caught_shiny)
  }

  const filtered: Pokemon[] = useMemo(() => {
    if (!user) return data as Pokemon[]
    return (data as Pokemon[]).filter((p) => {
      const me = status(p.id, user.id)
      const her = partner ? status(p.id, partner.id) : false
      switch (filter) {
        case 'mine-missing':
          return !me
        case 'partner-missing':
          return partner ? !her : false
        case 'both-missing':
          return !me && (!partner || !her)
        default:
          return true
      }
    })
  }, [catches, user, partner, filter])

  // Add search filter
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return filtered.filter((p) => {
      if (!needle) return true
      return p.name.toLowerCase().includes(needle) || p.id.toString() === needle.replace('#', '')
    })
  }, [filtered, q])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const mineCount = catches.filter((c) => c.user_id === user?.id).length
  const partnerCount = partner ? catches.filter((c) => c.user_id === partner.id).length : 0

  return (
    <main className="max-w-6xl mx-auto p-4">
      <header className="poke-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 p-2">
        <h1 className="text-2xl font-bold">Shiny Tracker</h1>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="pill">You: {user?.email} ({mineCount})</span>
          {partner && <span className="pill">Partner: {partner.email} ({partnerCount})</span>}

          {/* optional progress bars */}
          {/* ...progress bar blocks from above if you want them... */}

          <div className="dot-legend">
            <span><span className="dot" style={{ background: '#22c55e' }} /> caught</span>
            <span><span className="dot" style={{ background: '#2b2f36' }} /> missing</span>
          </div>

          <select className="border rounded-lg p-1" value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">All</option>
            <option value="mine-missing">Mine missing</option>
            <option value="partner-missing">Partner missing</option>
            <option value="both-missing">Both missing</option>
          </select>
          <input
            className="border rounded-lg p-1"
            placeholder="Search name or #id"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={signOut} className="rounded-xl border px-2 py-1 bg-white">Log out</button>
        </div>
      </header>


      <ul className="poke-grid list-none p-0 grid grid-cols-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
        {list.map((p) => {
          const me = user ? status(p.id, user.id) : false
          const her = partner ? status(p.id, partner.id) : false
          return (
            <li key={p.id} className="poke-card flex flex-col items-center justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">#{p.id.toString().padStart(4, '0')}</span>
                <div className="flex gap-1">
                  <span title="You" className={`w-3 h-3 rounded-full ${me ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span title="Partner" className={`w-3 h-3 rounded-full ${her ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              </div>
              <div className="flex justify-center items-center h-24">
                <img
                  src={p.sprite}
                  alt={p.name}
                  className="poke-sprite w-20 h-20"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="text-center text-xs mt-1">{p.name}</div>
              <button
                onClick={() => toggleMine(p.id)}
                className={`mt-2 w-full rounded-xl py-2 text-sm font-semibold ${me ? 'bg-green-600 text-white' : 'bg-[#0b1220] text-gray-300'
                  }`}
              >
                {me ? 'Shiny caught' : 'Mark shiny'}
              </button>

            </li>
          )
        })}
      </ul>
    </main>
  )
}
