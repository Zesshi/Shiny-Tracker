const SPRITE_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

/**
 * Sprite URL for a dex id.
 *
 * These are served straight from the PokeAPI sprite repo and cached
 * aggressively by the service worker (see public/sw.js), which is why images
 * are rendered `unoptimized` — routing them through Vercel's image optimiser
 * would burn the free-tier transformation quota for no benefit.
 */
export function spriteUrl(id: number, shiny: boolean) {
  return shiny ? `${SPRITE_BASE}/shiny/${id}.png` : `${SPRITE_BASE}/${id}.png`
}
