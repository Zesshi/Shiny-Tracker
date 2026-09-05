'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Brand } from '@/components/nav'
import { Icon } from '@/components/icon'
import { spriteUrl } from '@/lib/sprites'
import { GENS, TOTAL_POKEMON } from '@/lib/gens'
import { authErrorMessage, dataErrorMessage } from '@/lib/errors'
import { Alert, Button, Input, Spinner, TabPanel, Tabs } from '@/components/ui'

type Mode = 'signin' | 'signup'

const MODES = [
  { value: 'signin' as const, label: 'Sign in' },
  { value: 'signup' as const, label: 'Create account' },
]

const USERNAME_RULE = /^[a-z0-9_]{3,20}$/

function isEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value)
}

type Feedback = { tone: 'error' | 'success'; text: string } | null

export default function Login() {
  const [mode, setMode] = useState<Mode>('signin')
  const [identifier, setIdentifier] = useState('') // username OR email (sign in)
  const [email, setEmail] = useState('') // sign up
  const [username, setUsername] = useState('') // sign up
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function switchMode(next: Mode) {
    setMode(next)
    setFeedback(null)
    setFieldErrors({})
  }

  /* --- Sign in ---------------------------------------------------------- */
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    setFieldErrors({})

    const errors: Record<string, string> = {}
    if (!identifier.trim()) errors.identifier = 'Enter your username or email.'
    if (!password) errors.password = 'Enter your password.'
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      let loginEmail = identifier.trim()

      if (!isEmail(loginEmail)) {
        // Treat the identifier as a username and resolve it to an email.
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', loginEmail)
          .maybeSingle()

        if (error) {
          setFeedback({
            tone: 'error',
            text: dataErrorMessage(
              error,
              'Could not look up that username.',
              'signin',
            ),
          })
          return
        }
        if (!prof?.email) {
          setFieldErrors({ identifier: 'Username not found.' })
          return
        }
        loginEmail = prof.email
      }

      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })
      if (signErr) {
        setFeedback({
          tone: 'error',
          text: authErrorMessage(signErr, 'signin'),
        })
        return
      }

      window.location.href = '/'
    } catch {
      setFeedback({
        tone: 'error',
        text: 'We could not connect. Check your connection and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  /* --- Sign up ---------------------------------------------------------- */
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    setFieldErrors({})

    const uname = username.trim().toLowerCase()
    const errors: Record<string, string> = {}
    if (!email.trim()) errors.email = 'Enter your email address.'
    if (!USERNAME_RULE.test(uname)) {
      errors.username = 'Use 3–20 characters: a–z, 0–9 or underscore.'
    }
    if (password.length < 6) {
      errors.password = 'Use at least 6 characters.'
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const { data: exists, error: lookupErr } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', uname)
        .maybeSingle()

      if (lookupErr) {
        setFeedback({
          tone: 'error',
          text: dataErrorMessage(
            lookupErr,
            'Could not check that username.',
            'signup',
          ),
        })
        return
      }
      if (exists) {
        setFieldErrors({ username: 'That username is already taken.' })
        return
      }

      const { data, error: upErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: uname } },
      })
      if (upErr) {
        setFeedback({ tone: 'error', text: authErrorMessage(upErr, 'signup') })
        return
      }

      const uid = data.user?.id
      if (uid) {
        const { error: updErr } = await supabase
          .from('profiles')
          .update({ username: uname })
          .eq('id', uid)
        if (updErr) {
          setFeedback({
            tone: 'error',
            text: dataErrorMessage(
              updErr,
              'Your account was created, but the username could not be saved. You can set it in Settings.',
              'signup',
            ),
          })
          return
        }
      }

      setFeedback({
        tone: 'success',
        text: 'Account created. Check your email if confirmation is required, then sign in.',
      })
    } catch {
      setFeedback({
        tone: 'error',
        text: 'We could not connect. Check your connection and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-story" aria-label="About Shiny Tracker">
        <Brand />
        <div className="auth-story-center">
          <p className="eyebrow">FOR THE ONE-IN-THOUSANDS MOMENTS</p>
          <h2>
            Every shiny.
            <br />
            <em>
              A story worth
              <br />
              keeping.
            </em>
          </h2>
          <p className="auth-story-copy">
            Your collection, from the first sparkle to the final dex entry.
          </p>
          <div className="auth-specimens">
            {[
              { id: 1, name: 'Bulbasaur' },
              { id: 6, name: 'Charizard' },
              { id: 9, name: 'Blastoise' },
            ].map((p) => (
              <div key={p.id} className="auth-specimen">
                <span>#{String(p.id).padStart(4, '0')}</span>
                <Image
                  src={spriteUrl(p.id, true)}
                  width={112}
                  height={112}
                  alt={`Shiny ${p.name}`}
                  className="sprite"
                  unoptimized
                />
                <p>{p.name}</p>
                <small>✦ Shiny variant</small>
              </div>
            ))}
          </div>
        </div>
        <div className="auth-story-footer">
          <span>{TOTAL_POKEMON.toLocaleString()} Pokémon</span>
          <span>{GENS.length} regions</span>
          <span>Your journey</span>
        </div>
      </aside>
      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          <div className="auth-form-heading">
            <p className="eyebrow">YOUR FIELD JOURNAL</p>
            <h1>
              {mode === 'signin'
                ? 'Welcome back, trainer.'
                : 'Start your collection.'}
            </h1>
            <p>
              {mode === 'signin'
                ? 'Your next chapter starts with a little sparkle.'
                : 'A home for every shiny you find along the way.'}
            </p>
          </div>
          <div>
            <Tabs
              items={MODES}
              value={mode}
              onChange={switchMode}
              label="Authentication mode"
              idPrefix="auth"
              className="mb-5"
            />

            {feedback && (
              <Alert
                tone={feedback.tone}
                className="mb-4"
                title={
                  feedback.tone === 'error' ? 'Could not continue' : 'Success'
                }
              >
                {feedback.text}
              </Alert>
            )}

            {mode === 'signin' ? (
              <TabPanel value="signin" idPrefix="auth">
                <form
                  onSubmit={handleSignIn}
                  className="flex flex-col gap-4"
                  noValidate
                >
                  <Input
                    label="Username or email"
                    placeholder="ash_ketchum or ash@kanto.example"
                    value={identifier}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    error={fieldErrors.identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    autoComplete="current-password"
                    error={fieldErrors.password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={loading}
                    className="mt-1"
                  >
                    {loading && <Spinner className="size-4" />}
                    {loading ? 'Signing in…' : 'Sign in'}
                    {!loading && <Icon name="arrow" />}
                  </Button>
                </form>
              </TabPanel>
            ) : (
              <TabPanel value="signup" idPrefix="auth">
                <form
                  onSubmit={handleSignUp}
                  className="flex flex-col gap-4"
                  noValidate
                >
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    autoComplete="email"
                    error={fieldErrors.email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    label="Username"
                    placeholder="ash_ketchum"
                    value={username}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    hint="3–20 characters. Lowercase letters, numbers and underscore."
                    error={fieldErrors.username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={password}
                    autoComplete="new-password"
                    error={fieldErrors.password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={loading}
                    className="mt-1"
                  >
                    {loading && <Spinner className="size-4" />}
                    {loading ? 'Creating account…' : 'Create account'}
                  </Button>
                </form>
              </TabPanel>
            )}
          </div>
          <p className="auth-footnote">
            <Icon name="lock" />
            Your collection stays with your account.
          </p>
        </div>
      </div>
    </div>
  )
}
