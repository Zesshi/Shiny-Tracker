'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Profile = {
    id: string
    email: string | null
    username: string | null
    is_public: boolean
}

export default function Settings() {
    const [me, setMe] = useState<Profile | null>(null)
    const [username, setUsername] = useState('')
    const [isPublic, setIsPublic] = useState(true)

    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    // password change
    const [newPass, setNewPass] = useState('')
    const [newPass2, setNewPass2] = useState('')
    const [passMsg, setPassMsg] = useState<string | null>(null)
    const [passSaving, setPassSaving] = useState(false)

    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getUser()
            if (!data.user) { window.location.href = '/login'; return }
            const uid = data.user.id
            const { data: prof } = await supabase
                .from('profiles')
                .select('id,email,username,is_public')
                .eq('id', uid)
                .single()
            if (prof) {
                const p = prof as Profile
                setMe(p)
                setUsername(p.username ?? '')
                setIsPublic(p.is_public)
            }
        })()
    }, [])

    async function saveProfile() {
        if (!me) return
        setMsg(null)
        setSaving(true)
        try {
            const uname = username.trim().toLowerCase()
            if (!/^[a-z0-9_]{3,20}$/.test(uname)) {
                setMsg('Username must be 3–20 chars (a–z, 0–9, _).')
                return
            }
            // check availability excluding myself
            const { data: taken } = await supabase
                .from('profiles')
                .select('id')
                .ilike('username', uname)
                .neq('id', me.id)
                .maybeSingle()
            if (taken) { setMsg('Username is already taken.'); return }

            const { error } = await supabase
                .from('profiles')
                .update({ username: uname, is_public: isPublic })
                .eq('id', me.id)

            setMsg(error ? error.message : 'Saved!')
        } finally {
            setSaving(false)
        }
    }

    async function changePassword() {
        setPassMsg(null)
        if (newPass.length < 6) { setPassMsg('Password must be at least 6 characters.'); return }
        if (newPass !== newPass2) { setPassMsg('Passwords do not match.'); return }
        setPassSaving(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPass })
            setPassMsg(error ? error.message : 'Password updated.')
            if (!error) { setNewPass(''); setNewPass2('') }
        } finally {
            setPassSaving(false)
        }
    }

    const viewHref = username ? `/u/${username.toLowerCase()}` : '/settings'

    return (
        <main className="max-w-lg mx-auto p-6">
            <header className="flex items-center justify-between mb-4">
                <Link href="/" className="pill">← Back</Link>
                <h1 className="text-2xl font-bold">Settings</h1>
                {username ? <Link href={viewHref} className="pill">@{username}</Link> : <span className="opacity-0 pill">.</span>}
            </header>

            {/* Profile card */}
            <div className="card space-y-4">
                <div>
                    <label className="block text-sm text-dim mb-1">Email</label>
                    <div className="pill">{me?.email ?? '—'}</div>
                </div>

                <div>
                    <label className="block text-sm text-dim mb-1">Username</label>
                    <input
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="ash_ketchum"
                    />
                    <p className="text-xs text-dim mt-1">Lowercase letters, numbers, underscore.</p>
                </div>

                <div className="flex items-center gap-2">
                    <input id="pub" type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
                    <label htmlFor="pub">Public profile (others can view your shinies)</label>
                </div>

                <button onClick={saveProfile} className="btn disabled:opacity-60" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                </button>
                {msg && <p className="text-sm">{msg}</p>}
            </div>

            {/* Password card */}
            <div className="card space-y-3 mt-4">
                <h2 className="text-lg font-semibold">Change password</h2>

                <label className="block text-sm text-dim">New password (min 6)</label>
                <input
                    className="w-full"
                    type="password"
                    placeholder="New password"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                />

                <label className="block text-sm text-dim">Confirm new password</label>
                <input
                    className="w-full"
                    type="password"
                    placeholder="Confirm new password"
                    value={newPass2}
                    onChange={e => setNewPass2(e.target.value)}
                />

                <button onClick={changePassword} className="btn btn-primary disabled:opacity-60" disabled={passSaving}>
                    {passSaving ? 'Updating…' : 'Update password'}
                </button>
                {passMsg && <p className="text-sm">{passMsg}</p>}
            </div>

        </main>
    )
}
