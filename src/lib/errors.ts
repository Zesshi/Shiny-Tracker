/**
 * User-facing error messages.
 *
 * Supabase *auth* errors ("Invalid login credentials", "User already
 * registered") are written for end users and are safe to surface. PostgREST
 * *database* errors are not — they can leak table, column and policy names —
 * so those are replaced with a generic message and the original is logged in
 * development only.
 */

type SupabaseLikeError = { message?: string; code?: string } | null | undefined

const GENERIC = 'Something went wrong. Please try again.'

/** Auth error messages that are safe to show verbatim. */
const SAFE_AUTH_PATTERNS = [
  /invalid login credentials/i,
  /email not confirmed/i,
  /user already registered/i,
  /password should be at least/i,
  /unable to validate email address/i,
  /email rate limit exceeded/i,
  /for security purposes/i,
  /new password should be different/i,
  /signup( |s )?(is )?disabled/i,
]

function log(scope: string, error: unknown) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${scope}]`, error)
  }
}

/** Message for an error returned by supabase.auth.*. */
export function authErrorMessage(error: SupabaseLikeError, scope = 'auth'): string {
  if (!error) return GENERIC
  log(scope, error)
  const message = error.message ?? ''
  if (SAFE_AUTH_PATTERNS.some(re => re.test(message))) return message
  return GENERIC
}

/** Message for an error returned by a PostgREST query. Never echoes details. */
export function dataErrorMessage(
  error: SupabaseLikeError,
  fallback = GENERIC,
  scope = 'data',
): string {
  if (error) log(scope, error)
  return fallback
}

export { GENERIC as GENERIC_ERROR }
