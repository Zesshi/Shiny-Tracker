'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Icon, type IconName } from '@/components/icon'
import { TrainerSearch } from '@/components/trainer-search'
import { Spinner } from '@/components/ui'
import { GENS, TOTAL_POKEMON } from '@/lib/gens'

const NAV_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'My collection', icon: 'grid' },
  { href: '/search', label: 'Discover trainers', icon: 'users' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
]

export function Brand() {
  return (
    <Link href="/" className="brand-lockup" aria-label="Shiny Tracker home">
      <Image
        src="/icon-192.png"
        alt=""
        width={38}
        height={38}
        unoptimized
        priority
      />
      <span>
        shiny<span className="brand-word">tracker</span>
        <small>Collector’s companion</small>
      </span>
    </Link>
  )
}

export default function Nav() {
  const { status, user } = useAuth()
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState(false)
  if (pathname === '/login' || status === 'loading') return null
  if (status !== 'authenticated')
    return (
      <header className="public-nav">
        <Brand />
        <Link href="/login" className="text-sm text-brand">
          Sign in <span aria-hidden="true">↗</span>
        </Link>
      </header>
    )

  async function signOut() {
    setSigningOut(true)
    setSignOutError(false)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setSignOutError(true)
        return
      }
      window.location.href = '/login'
    } catch {
      setSignOutError(true)
    } finally {
      setSigningOut(false)
    }
  }

  const current =
    NAV_LINKS.find((link) => link.href === pathname)?.label ??
    'Trainer collection'
  return (
    <>
      <aside className="app-sidebar">
        <Brand />
        <p className="eyebrow nav-label">YOUR FIELD JOURNAL</p>
        <nav aria-label="Main" className="main-nav">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? 'is-active' : ''}`}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              <Icon name={link.icon} />
              <span>{link.label}</span>
              {pathname === link.href && <span className="nav-active-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-index">
          <p className="eyebrow">NATIONAL POKÉDEX</p>
          <p className="sidebar-dex-range">
            0001 <span>—</span> {TOTAL_POKEMON}
          </p>
          <p>{GENS.length} regions. One collection.</p>
        </div>
        <div className="sidebar-account">
          <div className="account-avatar" aria-hidden="true">
            {user?.email?.[0]?.toUpperCase() ?? 'T'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Your account</p>
            <p className="truncate text-xs text-ink-muted">{user?.email}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={signingOut ? 'Signing out' : 'Sign out'}
            title="Sign out"
            disabled={signingOut}
            onClick={signOut}
          >
            {signingOut ? (
              <Spinner className="size-4" />
            ) : (
              <Icon name="logout" />
            )}
          </button>
        </div>
        {signOutError && (
          <p role="alert" className="p-3 text-sm text-danger">
            Could not sign out. Please try again.
          </p>
        )}
      </aside>
      <header className="app-topbar">
        <div className="breadcrumb">
          <span>Field journal</span>
          <Icon name="chevron" />
          <span>{current}</span>
        </div>
        <div className="topbar-mobile-brand">
          <Brand />
        </div>
        <div className="topbar-actions">
          <TrainerSearch className="hidden w-56 xl:block" />
          <span className="edition-label">
            <Icon name="sparkles" /> National shiny dex
          </span>
        </div>
        <button
          type="button"
          className="mobile-signout icon-button"
          title="Sign out"
          aria-label="Sign out"
          disabled={signingOut}
          onClick={signOut}
        >
          <Icon name="logout" />
        </button>
      </header>
      {signOutError && (
        <p role="alert" className="mobile-signout-error">
          Could not sign out. Please try again.
        </p>
      )}
    </>
  )
}
