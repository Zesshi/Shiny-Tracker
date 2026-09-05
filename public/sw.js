/* Shiny Tracker service worker.
 *
 * Three caches:
 *   STATIC  - app shell documents
 *   DATA    - same-origin assets (JS, CSS, images, generation banners)
 *   SPRITES - PokeAPI sprite images, cached permanently
 *
 * Bump the version suffix whenever the shell changes so clients pick up the
 * new build instead of serving a stale document from cache.
 */
const VERSION = 'v5';
const STATIC = `static-${VERSION}`;
const DATA = `data-${VERSION}`;
// Preserve existing immutable sprites when only the UI shell changes.
const SPRITES = 'sprites-v4';

/* Only the entry document and the manifest are precached.
 *
 * Generation banners used to be listed here individually. They are cached on
 * first view by the same-origin handler below instead, which means:
 *   - adding a generation needs no change to this file
 *   - a missing /gen/<key>.webp can no longer fail the whole install
 *     (cache.addAll rejects if any single entry 404s)
 *   - install no longer blocks on ~490 KB of artwork
 * A generation with no artwork falls back to a CSS gradient (see globals.css).
 */
const APP_SHELL = ['/', '/manifest.webmanifest'];

const SPRITE_URL =
  /raw\.githubusercontent\.com\/PokeAPI\/sprites\/master\/sprites\/pokemon\//;

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC);
      // Tolerate individual failures rather than aborting the install.
      await Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      );
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) =>
          [STATIC, DATA, SPRITES].includes(k) ? undefined : caches.delete(k)
        )
      );
    })()
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Sprites: cache-first and kept forever. They are immutable, and this is
  // what keeps repeat visits from re-downloading ~1000 images.
  if (SPRITE_URL.test(url.href)) {
    e.respondWith(
      (async () => {
        const cache = await caches.open(SPRITES);
        const cached = await cache.match(url.href, { ignoreVary: true });
        if (cached) return cached;
        try {
          const res = await fetch(url.href, {
            mode: 'no-cors',
            credentials: 'omit',
          });
          // Opaque responses are fine for <img>; cache them as-is.
          await cache.put(url.href, res.clone());
          return res;
        } catch {
          return new Response('', { status: 503 });
        }
      })()
    );
    return;
  }

  // Never cache Supabase (or any cross-origin API) traffic.
  if (url.origin !== self.location.origin) return;

  // Same-origin: stale-while-revalidate.
  if (e.request.method !== 'GET') return;
  e.respondWith(
    (async () => {
      const cacheName =
        e.request.destination === 'document' ? STATIC : DATA;
      const cache = await caches.open(cacheName);
      const cached = await cache.match(e.request);
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.status === 200) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })()
  );
});
