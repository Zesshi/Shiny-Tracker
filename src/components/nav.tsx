'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { useAuth } from '@/components/auth-provider'
import { TrainerSearch } from '@/components/trainer-search'
import { Spinner } from '@/components/ui'

const NAV_LINKS = [
  { href: '/', label: 'My dex' },
  { href: '/search', label: 'Trainers' },
  { href: '/settings', label: 'Settings' },
] as const

/**
 * Application header.
 *
 * Hidden for signed-out visitors, matching the original behaviour. It renders
 * nothing at all (rather than a skeleton) while the session resolves, so the
 * signed-out /login screen never flashes a header.
 */
export default function Nav() {
  const { status } = useAuth()
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)

  if (status !== 'authenticated') return null

  async function signOut() {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
    } finally {
      // Full reload so no signed-in state survives in memory.
      window.location.href = '/login'
    }
  }

  return (
    <header className="sticky top-0 z-40 h-(--spacing-header) border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-hover"
        >
          <Image
            src="/icon-192.png"
            alt=""
            width={28}
            height={28}
            className="rounded-md"
            priority
          />
          <span className="hidden text-sm font-bold tracking-tight text-ink sm:inline">
            Shiny Tracker
          </span>
          <span className="sr-only">Shiny Tracker — home</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-0.5">
          {NAV_LINKS.map(link => {
            const active =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-sm font-medium sm:px-3',
                  'transition-colors duration-(--transition-fast)',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-hover',
                  active
                    ? 'bg-chip text-ink'
                    : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Trainer lookup is available from anywhere on wider screens; on
              small screens the Trainers nav link covers the same ground. */}
          <TrainerSearch className="hidden w-56 lg:block" />

          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-line px-3',
              'text-sm font-medium text-ink-muted',
              'transition-colors duration-(--transition-fast)',
              'hover:bg-surface-hover hover:text-ink',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-hover',
              'disabled:cursor-not-allowed disabled:opacity-55',
            )}
          >
            {signingOut && <Spinner className="size-3.5" />}
            {signingOut ? 'Signing out…' : 'Log out'}
          </button>
        </div>
      </div>
    </header>
  )
}
