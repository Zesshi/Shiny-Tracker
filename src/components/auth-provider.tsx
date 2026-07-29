'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { AuthUser } from '@/lib/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthState = {
  status: AuthStatus
  user: AuthUser | null
}

const AuthContext = createContext<AuthState>({ status: 'loading', user: null })

/**
 * Resolves the Supabase session once per page load and shares it.
 *
 * Previously both <Nav> and each protected page called
 * `supabase.auth.getUser()` independently, so every navigation made two
 * requests to /auth/v1/user. Hoisting it here halves that.
 *
 * `getUser()` is kept (rather than the cheaper local-only `getSession()`)
 * because it validates the token server-side — swapping it would weaken the
 * auth check. The subsequent `onAuthStateChange` subscription is a local
 * event emitter and issues no requests of its own.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null })

  useEffect(() => {
    let active = true

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return
        setState(
          data.user
            ? {
                status: 'authenticated',
                user: { id: data.user.id, email: data.user.email ?? null },
              }
            : { status: 'anonymous', user: null },
        )
      })
      .catch(() => {
        if (active) setState({ status: 'anonymous', user: null })
      })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setState(
        session?.user
          ? {
              status: 'authenticated',
              user: { id: session.user.id, email: session.user.email ?? null },
            }
          : { status: 'anonymous', user: null },
      )
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

/**
 * Auth gate for protected pages.
 *
 * Redirects to /login once the session is known to be absent. Returns
 * `status` so callers can render a loading state instead of protected
 * content while the session is still resolving — this is what prevents the
 * content flash the old pages had.
 */
export function useRequireAuth(): AuthState {
  const state = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (state.status === 'anonymous') router.replace('/login')
  }, [state.status, router])

  return useMemo(() => state, [state])
}
