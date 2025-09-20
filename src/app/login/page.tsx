'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    setError(null)
    const redirect = typeof window !== 'undefined' ? window.location.origin + '/' : undefined
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">Sign in</h1>
        {sent ? (
          <p>Check your email for a magic link.</p>
        ) : (
          <>
            <input
              className="w-full border rounded-lg p-2"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="w-full rounded-2xl bg-black text-white py-2" onClick={signIn}>
              Send magic link
            </button>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </>
        )}
      </div>
    </main>
  )
}
