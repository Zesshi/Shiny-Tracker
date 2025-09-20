'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Mode = 'signin' | 'signup'

export default function Login() {
    const [mode, setMode] = useState<Mode>('signin')
    const [identifier, setIdentifier] = useState('')   // username OR email (signin)
    const [email, setEmail] = useState('')             // signup
    const [username, setUsername] = useState('')       // signup
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    function isEmail(v: string) {
        return /\S+@\S+\.\S+/.test(v)
    }

    async function handleSignIn() {
        setMsg(null); setLoading(true)
        try {
            let loginEmail = identifier.trim()
            if (!isEmail(loginEmail)) {
                // treat as username -> look up email
                const { data: prof, error } = await supabase
                    .from('profiles')
                    .select('email')
                    .ilike('username', loginEmail)
                    .maybeSingle()
                if (error || !prof?.email) {
                    setMsg('Username not found.'); return
                }
                loginEmail = prof.email
            }
            const { error: signErr } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password,
            })
            if (signErr) { setMsg(signErr.message); return }
            window.location.href = '/'
        } finally {
            setLoading(false)
        }
    }

    async function handleSignUp() {
        setMsg(null); setLoading(true)
        try {
            const uname = username.trim().toLowerCase()
            if (!/^[a-z0-9_]{3,20}$/.test(uname)) {
                setMsg('Username must be 3–20 chars (a–z, 0–9, underscore).'); return
            }
            // ensure username free
            const { data: exists } = await supabase.from('profiles').select('id').ilike('username', uname).maybeSingle()
            if (exists) { setMsg('Username is already taken.'); return }

            const { data, error: upErr } = await supabase.auth.signUp({
                email: email.trim(),
                password,
            })
            if (upErr) { setMsg(upErr.message); return }

            const uid = data.user?.id
            if (uid) {
                // attach username to profile
                const { error: updErr } = await supabase
                    .from('profiles')
                    .update({ username: uname })
                    .eq('id', uid)
                if (updErr) {
                    setMsg(updErr.message); return
                }
            }

            // If email confirmation is ON, tell user to check inbox
            setMsg('Account created. Check your email if confirmation is required.')
            // Optional: auto-redirect to home if confirmation disabled:
            // window.location.href = '/'
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full auth-card card">
                <h1 className="auth-title">Shiny Tracker</h1>
                <p className="auth-subtitle">Sign in to track your shiny dex</p>

                {/* Tabs */}
                <div className="tabs mb-4" role="tablist" aria-label="Auth mode">
                    <button
                        role="tab"
                        aria-selected={mode === 'signin'}
                        className={`tab ${mode === 'signin' ? 'active' : ''}`}
                        onClick={() => setMode('signin')}
                    >
                        Sign in
                    </button>
                    <button
                        role="tab"
                        aria-selected={mode === 'signup'}
                        className={`tab ${mode === 'signup' ? 'active' : ''}`}
                        onClick={() => setMode('signup')}
                    >
                        Create account
                    </button>
                </div>

                {mode === 'signin' ? (
                    <div className="form-stack">
                        <div className="group">
                            <label className="text-sm text-dim">Username or email</label>
                            <input
                                className="w-full input-lg"
                                placeholder="ash_ketchum or ash@kanto.example"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                            />
                        </div>
                        <div className="group">
                            <label className="text-sm text-dim">Password</label>
                            <input
                                className="w-full input-lg"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button className="w-full btn btn-primary btn-lg disabled:opacity-60" onClick={handleSignIn} disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </div>
                ) : (
                    <div className="form-stack">
                        <div className="group">
                            <label className="text-sm text-dim">Email</label>
                            <input
                                className="w-full input-lg"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="group">
                            <label className="text-sm text-dim">Username</label>
                            <input
                                className="w-full input-lg"
                                placeholder="ash_ketchum"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="group">
                            <label className="text-sm text-dim">Password</label>
                            <input
                                className="w-full input-lg"
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button className="w-full btn btn-primary btn-lg disabled:opacity-60" onClick={handleSignUp} disabled={loading}>
                            {loading ? 'Creating…' : 'Create account'}
                        </button>
                    </div>
                )}

                {msg && <p className="text-sm mt-3">{msg}</p>}
            </div>
        </main>
    )
}
