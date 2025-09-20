'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Settings() {
  const [me, setMe] = useState<{id:string,email:string|null}|null>(null)
  const [partnerEmail, setPartnerEmail] = useState('')
  const [msg, setMsg] = useState<string| null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else setMe({ 
        id: data.user.id, 
        email: data.user.email ?? null
    })
    })
  }, [])

  async function pair() {
    setMsg(null)
    if (!me) return
    // look up partner by email in profiles
    const { data: profiles } = await supabase.from('profiles').select('id,email').ilike('email', partnerEmail)
    const partner = profiles?.[0]
    if (!partner) { setMsg('No user with that email (they must log in once first).'); return }
    // insert pair; order doesn't matter
    const { error } = await supabase.from('pairs').insert({ a: me.id, b: partner.id })
    if (error) setMsg(error.message)
    else setMsg('Paired! Go back to / and filters will use this partner.')
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="mb-2">You: {me?.email}</p>
      <div className="bg-white rounded-2xl shadow p-4 space-y-3">
        <label className="block text-sm">Partner email</label>
        <input className="w-full border rounded-lg p-2" value={partnerEmail} onChange={e=>setPartnerEmail(e.target.value)} placeholder="partner@example.com" />
        <button onClick={pair} className="rounded-xl bg-black text-white px-4 py-2">Save pairing</button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </main>
  )
}
