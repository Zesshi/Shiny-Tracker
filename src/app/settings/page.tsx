'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Profile = { id: string; email: string|null; username: string|null; is_public: boolean }

export default function Settings() {
  const [me, setMe] = useState<Profile|null>(null)
  const [username, setUsername] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [msg, setMsg] = useState<string| null>(null)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      const uid = data.user.id
      const { data: prof } = await supabase.from('profiles')
        .select('id,email,username,is_public').eq('id', uid).single()
      if (prof) {
        setMe(prof as Profile)
        setUsername((prof as Profile).username ?? '')
        setIsPublic((prof as Profile).is_public)
      }
    })()
  }, [])

  async function save() {
    if (!me) return
    setMsg(null)
    // simple client-side validation to match DB regex
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setMsg('Username must be 3–20 chars: a–z, 0–9, underscore.')
      return
    }
    const { error } = await supabase.from('profiles')
      .update({ username, is_public: isPublic })
      .eq('id', me.id)
    setMsg(error ? error.message : 'Saved!')
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="card space-y-4">
        <div>
          <label className="block text-sm text-dim mb-1">Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="ash_ketchum"/>
          <p className="text-xs text-dim mt-1">Only lowercase letters, numbers, and underscore.</p>
        </div>
        <div className="flex items-center gap-2">
          <input id="pub" type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} />
          <label htmlFor="pub">Public profile (others can view your shinies)</label>
        </div>
        <button onClick={save} className="btn">Save</button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </main>
  )
}
