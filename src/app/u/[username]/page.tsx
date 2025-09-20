'use client'
import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import data from '@/data/pokemon.json'


type Pokemon = { id: number; name: string; sprite: string }
type Catch = { user_id: string; pokemon_id: number; caught_shiny: boolean }
type User = { id: string; email: string | null }
type Profile = { id: string; username: string; is_public: boolean }

export default function PublicProfile() {
    const params = useParams<{ username: string }>()
    const uname = String(params.username || '').toLowerCase()
    const [q, setQ] = useState('')
    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase()
        return (data as Pokemon[]).filter(p =>
            !needle ||
            p.name.toLowerCase().includes(needle) ||
            p.id.toString() === needle.replace('#', '')
        )
    }, [q])

    const [viewer, setViewer] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [catches, setCatches] = useState<Catch[]>([])
    const caughtCount = useMemo(
        () => catches.filter(c => c.caught_shiny).length,
        [catches]
    )


    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setViewer({ id: data.user.id, email: data.user.email ?? null })
        })
    }, [])

    useEffect(() => {
        if (!uname) return
            ; (async () => {
                const { data: prof } = await supabase.from('profiles')
                    .select('id,username,is_public').ilike('username', uname).maybeSingle()
                if (!prof) { setProfile(null); return }
                setProfile(prof as Profile)
                const { data: cats } = await supabase.from('catches')
                    .select('user_id,pokemon_id,caught_shiny').eq('user_id', prof.id)
                setCatches((cats || []) as Catch[])
            })()
    }, [uname])

    const isOwner = viewer?.id === profile?.id
    const status = (pokeId: number) =>
        catches.some(c => c.pokemon_id === pokeId && c.caught_shiny)

    if (profile === null) {
        return (
            <main className="max-w-4xl mx-auto p-4">
                <h1 className="text-2xl font-bold">User not found</h1>
                <p className="mt-2">
                    Go back to{' '}
                    <Link href="/" className="underline">
                        home
                    </Link>
                    .
                </p>
            </main>
        )
    }

    return (
        <main className="max-w-7xl mx-auto p-4">
            <header className="poke-header flex items-center justify-between gap-2 mb-4 p-2">
                <h1 className="text-2xl font-bold">@{profile.username}</h1>
                <input
                    className="border p-1"
                    placeholder="Search name or #id"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />

                <div className="flex items-center gap-2">
                    <span className="pill">{caughtCount}/1025 caught</span>
                    {!profile.is_public && !isOwner && (<span className="pill">This profile is private</span>)}
                </div>
            </header>

            <ul className="poke-grid">
                {filtered.map(p => {
                    const has = status(p.id)
                    return (
                        <li key={p.id} className={`poke-card flex flex-col items-center justify-between ${has ? 'shine' : ''}`}>

                            <div className="w-full flex items-center justify-between mb-1">
                                <span className="text-[11px] font-medium opacity-80">#{p.id.toString().padStart(4, '0')}</span>
                                <span title="Owner" className={`w-2.5 h-2.5 rounded-full ${has ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>

                            <div className="flex justify-center items-center h-20">
                                <Image src={p.sprite} alt={p.name} width={72} height={72} className="poke-sprite" loading="lazy" />
                            </div>

                            <div className="text-center text-[11px] mt-1">{p.name}</div>

                            {isOwner ? (
                                <Link href="/" className="mt-2 w-full btn btn-tonal text-center">Manage on Home</Link>
                            ) : (
                                <div className={`mt-2 w-full btn ${has ? 'btn-primary' : 'btn-tonal'} text-center`}>
                                    {has ? 'Shiny caught' : 'Missing'}
                                </div>
                            )}
                        </li>
                    )
                })}
            </ul>
        </main>
    )
}
