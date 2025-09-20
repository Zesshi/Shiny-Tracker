// /src/components/nav.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type User = { id: string; email: string | null }
type ProfileRow = { username: string | null }

export default function Nav() {
  const [ready, setReady] = useState(false)
  const [me, setMe] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setMe({ id: data.user.id, email: data.user.email ?? null })
        const { data: prof } = await supabase
          .from('profiles').select('username').eq('id', data.user.id).maybeSingle().returns<ProfileRow>()
        if (prof) setUsername(prof.username ?? null)
      }
      setReady(true)
    })()
  }, [])

  if (!ready || !me) return null   // hide nav when not signed in

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="poke-header flex items-center justify-between p-3 mb-4">
      <Link href="/" className="text-xl font-bold">Shiny Tracker</Link>
      <div className="flex items-center gap-2 text-sm">
        {username && <Link href={`/u/${username}`} className="pill">Profile</Link>}
        <Link href="/settings" className="pill">Settings</Link>
        <button onClick={signOut} className="pill">Log out</button>
      </div>
    </nav>
  )
}
