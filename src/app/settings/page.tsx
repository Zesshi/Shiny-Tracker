'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRequireAuth } from '@/components/auth-provider'
import { authErrorMessage, dataErrorMessage } from '@/lib/errors'
import type { Profile } from '@/lib/types'
import { Icon } from '@/components/icon'
import {
  Alert,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Container,
  ErrorState,
  Input,
  LinkButton,
  PageLoading,
  Spinner,
} from '@/components/ui'

const USERNAME_RULE = /^[a-z0-9_]{3,20}$/

type Feedback = { tone: 'error' | 'success'; text: string } | null

export default function Settings() {
  const { status, user } = useRequireAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [username, setUsername] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null)
  const [usernameError, setUsernameError] = useState<string | undefined>()

  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')
  const [passSaving, setPassSaving] = useState(false)
  const [passFeedback, setPassFeedback] = useState<Feedback>(null)
  const [passErrors, setPassErrors] = useState<Record<string, string>>({})

  const userId = user?.id

  const loadProfile = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setLoadError(null)

    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,username,is_public')
      .eq('id', userId)
      .single<Profile>()

    if (error) {
      setLoadError(
        dataErrorMessage(error, 'We could not load your profile.', 'settings'),
      )
    } else if (data) {
      setProfile(data)
      setUsername(data.username ?? '')
      setIsPublic(data.is_public)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  /* --- Save profile ----------------------------------------------------- */
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return

    setProfileFeedback(null)
    setUsernameError(undefined)

    const uname = username.trim().toLowerCase()
    if (!USERNAME_RULE.test(uname)) {
      setUsernameError('Use 3–20 characters: a–z, 0–9 or underscore.')
      return
    }

    setSaving(true)
    try {
      const { data: taken, error: lookupErr } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', uname)
        .neq('id', profile.id)
        .maybeSingle()

      if (lookupErr) {
        setProfileFeedback({
          tone: 'error',
          text: dataErrorMessage(
            lookupErr,
            'Could not check that username.',
            'settings',
          ),
        })
        return
      }
      if (taken) {
        setUsernameError('That username is already taken.')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({ username: uname, is_public: isPublic })
        .eq('id', profile.id)

      if (error) {
        setProfileFeedback({
          tone: 'error',
          text: dataErrorMessage(
            error,
            'Your changes could not be saved.',
            'settings',
          ),
        })
        return
      }

      // Reuse the values we just wrote instead of re-reading the row.
      setProfile({ ...profile, username: uname, is_public: isPublic })
      setProfileFeedback({ tone: 'success', text: 'Profile saved.' })
    } finally {
      setSaving(false)
    }
  }

  /* --- Change password -------------------------------------------------- */
  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPassFeedback(null)

    const errors: Record<string, string> = {}
    if (newPass.length < 6) errors.newPass = 'Use at least 6 characters.'
    if (newPass !== newPass2) errors.newPass2 = 'Passwords do not match.'
    setPassErrors(errors)
    if (Object.keys(errors).length) return

    setPassSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass })
      if (error) {
        setPassFeedback({
          tone: 'error',
          text: authErrorMessage(error, 'password'),
        })
        return
      }
      setPassFeedback({ tone: 'success', text: 'Password updated.' })
      setNewPass('')
      setNewPass2('')
    } finally {
      setPassSaving(false)
    }
  }

  /* --- Render ----------------------------------------------------------- */
  if (status !== 'authenticated') {
    return (
      <Container width="md">
        <PageLoading label="Checking your session" />
      </Container>
    )
  }

  const profileHref = profile?.username ? `/u/${profile.username}` : null
  const profileChanged =
    username.trim().toLowerCase() !== profile?.username ||
    isPublic !== profile?.is_public

  return (
    <div className="page-container settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MAKE YOURSELF AT HOME</p>
          <h1>
            Account settings<span className="text-brand">.</span>
          </h1>
          <p>Your trainer identity, your privacy, your peace of mind.</p>
        </div>
        <div>
          {profileHref && (
            <LinkButton href={profileHref} variant="secondary" size="sm">
              View @{profile?.username}
            </LinkButton>
          )}
        </div>
      </div>

      {loading ? (
        <PageLoading label="Loading your profile" />
      ) : loadError ? (
        <ErrorState
          description={loadError}
          action={
            <Button variant="secondary" onClick={() => void loadProfile()}>
              Try again
            </Button>
          }
        />
      ) : (
        <div className="settings-grid">
          <Card padding="lg" className="settings-card">
            <div className="settings-section-label">
              <Icon name="users" />
              <span>TRAINER IDENTITY</span>
            </div>
            <CardHeader
              title="Your public profile"
              description="Your username is how other trainers find you."
            />

            <form
              onSubmit={saveProfile}
              className="mt-5 flex flex-col gap-4"
              noValidate
            >
              <div>
                <p className="text-sm font-medium text-ink-muted">Email</p>
                <p className="mt-1.5 truncate rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink-muted">
                  {profile?.email ?? '—'}
                </p>
              </div>

              <Input
                label="Username"
                value={username}
                placeholder="ash_ketchum"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                hint="Lowercase letters, numbers and underscore."
                error={usernameError}
                disabled={saving}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setProfileFeedback(null)
                  setUsernameError(undefined)
                }}
              />

              <div className="visibility-setting">
                <Checkbox
                  label="Make my collection public"
                  hint="Other trainers can view your shiny dex at your profile URL."
                  checked={isPublic}
                  disabled={saving}
                  onChange={(e) => {
                    setIsPublic(e.target.checked)
                    setProfileFeedback(null)
                  }}
                />
              </div>

              {profileFeedback && (
                <Alert tone={profileFeedback.tone}>
                  {profileFeedback.text}
                </Alert>
              )}

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving || !profileChanged}
                >
                  {saving && <Spinner className="size-4" />}
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </Card>

          <Card padding="lg" className="settings-card">
            <div className="settings-section-label">
              <Icon name="lock" />
              <span>ACCOUNT SECURITY</span>
            </div>
            <CardHeader
              title="Change password"
              description="You will stay signed in on this device."
            />

            <form
              onSubmit={changePassword}
              className="mt-5 flex flex-col gap-4"
              noValidate
            >
              <Input
                label="New password"
                type="password"
                value={newPass}
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
                error={passErrors.newPass}
                disabled={passSaving}
                onChange={(e) => setNewPass(e.target.value)}
              />
              <Input
                label="Confirm new password"
                type="password"
                value={newPass2}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                error={passErrors.newPass2}
                disabled={passSaving}
                onChange={(e) => setNewPass2(e.target.value)}
              />

              {passFeedback && (
                <Alert tone={passFeedback.tone}>{passFeedback.text}</Alert>
              )}

              <div>
                <Button type="submit" variant="primary" disabled={passSaving}>
                  {passSaving && <Spinner className="size-4" />}
                  {passSaving ? 'Updating…' : 'Update password'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      <p className="settings-note">
        <Icon name="lock" />
        Your email is used for sign-in and is not displayed on your public
        collection.
      </p>
    </div>
  )
}
