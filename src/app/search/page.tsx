'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Row = { username: string }

export default function Search() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    const id = setTimeout(async () => {
      if (!q) { setRows([]); return }
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', `%${q}%`)
        .limit(20)
      setRows((data || []) as Row[])
    }, 250)
    return () => clearTimeout(id)
  }, [q])

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Find Trainers</h1>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="username"/>
      <ul className="mt-4 space-y-2">
        {rows.map(r=>(
          <li key={r.username} className="card">
            <Link href={`/u/${r.username}`}>@{r.username}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
