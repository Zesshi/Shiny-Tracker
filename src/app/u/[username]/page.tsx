'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import data from '@/data/pokemon.json'

type Pokemon = { id:number; name:string; sprite:string }
type Catch = { user_id:string; pokemon_id:number; caught_shiny:boolean }
type User = { id:string; email:string|null }
type Profile = { id:string; username:string; is_public:boolean }

export default function PublicProfile({ params }: { params: { username: string }}) {
  const uname = params.username.toLowerCase()
  const [viewer, setViewer] = useState<User|null>(null)
  const [profile, setProfile] = useState<Profile|null>(null)
  const [catches, setCatches] = useState<Catch[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({data})=>{
      if (data.user) setViewer({ id: data.user.id, email: data.user.email ?? null })
    })
  }, [])

  useEffect(() => {
    (async () => {
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
  const status = (pokeId:number) =>
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
    <main className="max-w-6xl mx-auto p-4">
      <header className="poke-header flex items-center justify-between gap-2 mb-4 p-2">
        <h1 className="text-2xl font-bold">@{profile.username}</h1>
        {!profile.is_public && !isOwner && (
          <span className="pill">This profile is private</span>
        )}
        {isOwner && (
          <Link href="/settings" className="pill">Edit profile</Link>
        )}
      </header>

      <ul className="list-none p-0 grid grid-cols-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
        {(data as Pokemon[]).map(p=>{
          const has = status(p.id)
          return (
            <li key={p.id} className="poke-card flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-sm font-medium">#{p.id.toString().padStart(4,'0')}</span>
                <div className="flex gap-1">
                  <span title="Owner" className={`w-3 h-3 rounded-full ${has ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              </div>
              <div className="flex justify-center items-center h-24">
                <Image src={p.sprite} alt={p.name} width={80} height={80} className="poke-sprite" loading="lazy"/>
              </div>
              <div className="text-center text-xs mt-1">{p.name}</div>

              {isOwner ? (
                <Link href="/" className="w-full rounded-xl py-2 text-sm font-semibold bg-[#0b1220] text-gray-300 text-center">
                  Manage on Home
                </Link>
              ) : (
                <div className={`w-full rounded-xl py-2 text-sm font-semibold text-center ${has ? 'bg-green-600 text-white' : 'bg-[#0b1220] text-gray-300'}`}>
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
