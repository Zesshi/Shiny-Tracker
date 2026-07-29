'use client'

import { useEffect } from 'react'

/**
 * Registers the PWA service worker — in production only.
 *
 * public/sw.js caches same-origin assets (including /_next/static chunks) with
 * a stale-while-revalidate strategy. That is exactly what we want in
 * production, and exactly what we do not want in development: the cached chunk
 * wins over the freshly compiled one, so source edits appear to have no
 * effect and Fast Refresh silently fights the cache.
 *
 * In development we therefore skip registration *and* tear down anything left
 * over from an earlier session (or from before this guard existed), so a
 * developer who already has the worker installed is healed automatically
 * rather than having to clear site data by hand.
 */
export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
      return
    }

    void (async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        if (registrations.length === 0) return

        await Promise.all(registrations.map(r => r.unregister()))
        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map(k => caches.delete(k)))
        }
        console.info(
          '[dev] Stale service worker unregistered and caches cleared. ' +
            'Reload once to load the latest code.',
        )
      } catch {
        /* nothing useful to do if teardown fails */
      }
    })()
  }, [])

  return null
}
