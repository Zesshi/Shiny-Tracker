/**
 * Shared data types.
 *
 * These mirror the Supabase schema exactly. The property names ARE the
 * database column names and are part of the contract with PostgREST — do not
 * rename them.
 *
 *   table `catches`  : user_id, pokemon_id, caught_shiny
 *                      (unique on user_id + pokemon_id — see the upsert
 *                       onConflict target in lib/offline-queue.ts)
 *   table `profiles` : id, email, username, is_public
 */

export type Catch = {
  user_id: string
  pokemon_id: number
  caught_shiny: boolean
}

export type Profile = {
  id: string
  email: string | null
  username: string | null
  is_public: boolean
}

/** Shape used by trainer search results (a narrowed `profiles` select). */
export type TrainerSummary = {
  username: string
  is_public: boolean
}

/** Minimal authenticated user, derived from the Supabase session. */
export type AuthUser = {
  id: string
  email: string | null
}
