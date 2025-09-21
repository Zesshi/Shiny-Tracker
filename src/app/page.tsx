'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import data from '@/data/pokemon.json'

type Pokemon = { id: number; name: string; sprite: string }
type Catch = { user_id: string; pokemon_id: number; caught_shiny: boolean }
type User = { id: string; email: string | null }
type Filter = 'all' | 'mine-missing' | 'mine-caught'
type TrainerRow = { username: string; is_public: boolean }

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [catches, setCatches] = useState<Catch[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [trainerQ, setTrainerQ] = useState('')
  const [trainerRows, setTrainerRows] = useState<TrainerRow[]>([])

  // Ensure logged in
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      setUser({ id: data.user.id, email: data.user.email ?? null })
      // load my catches
      const { data: cats } = await supabase
        .from('catches')
        .select('user_id,pokemon_id,caught_shiny')
        .eq('user_id', data.user.id)
        .returns<Catch[]>()
      setCatches(cats || [])
    })
  }, [])

  useEffect(() => {
    const id = setTimeout(async () => {
      const q = trainerQ.trim().toLowerCase()
      if (!q) { setTrainerRows([]); return }
      const { data } = await supabase
        .from('profiles')
        .select('username,is_public')
        .ilike('username', `%${q}%`)
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
      if (data && data[0]) setCatches(prev => prev.map(c => (c.user_id === user.id && c.pokemon_id === pokemon_id ? data[0] : c)))
    } else {
      const { data } = await supabase
        .from('catches')
        .insert({ user_id: user.id, pokemon_id, caught_shiny: true })
        .select()
        .returns<Catch[]>()
      if (data && data[0]) setCatches(prev => [...prev, data[0]])
    }
  }

  const filtered: Pokemon[] = useMemo(() => {
    const list = (data as Pokemon[])
    const needle = q.trim().toLowerCase()
    return list.filter(p => {
      const mine = status(p.id)
      const passesFilter =
        filter === 'all' ? true :
          filter === 'mine-missing' ? !mine :
            mine // 'mine-caught'
      const passesSearch = !needle || p.name.toLowerCase().includes(needle) || p.id.toString() === needle.replace('#', '')
      return passesFilter && passesSearch
    })
  }, [status, filter, q])

  const mineCount = catches.length

  return (
    <main className="max-w-7xl mx-auto p-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold">Your Shinies ({mineCount}/1025)</h1>

        {/* one shared row */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
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

          {/* trainer search lives on the same line */}
          <div className="relative">
            <input
              className="border p-1"
              placeholder="Find @username"
              value={trainerQ}
              onChange={(e) => setTrainerQ(e.target.value)}
            />
            {trainerRows.length > 0 && (
              <div className="results-panel">
                {trainerRows.map((r) => (
                  <a key={r.username} href={`/u/${r.username}`} className="result-item">
                    @{r.username}
                    {!r.is_public && <span className="private">private</span>}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>


      <ul className="poke-grid">
        {filtered.map(p => {
          const mine = status(p.id)
          return (
            <li key={p.id} className={`poke-card flex flex-col items-center justify-between ${mine ? 'shine' : ''}`}>
              <div className="w-full flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium opacity-80">#{p.id.toString().padStart(4, '0')}</span>
                <span title="You" className={`w-2.5 h-2.5 rounded-full ${mine ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>

              <div className="flex justify-center items-center h-20">
                <Image src={p.sprite} alt={p.name} width={72} height={72} className="poke-sprite" loading="lazy" unoptimized/>
              </div>

              <div className="text-center text-[11px] mt-1">{p.name}</div>

              <button
                onClick={() => toggleMine(p.id)}
                className={`mt-2 w-full btn ${mine ? 'btn-primary' : 'btn-tonal'}`}
              >
                {mine ? 'Shiny caught' : 'Mark shiny'}
              </button>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
