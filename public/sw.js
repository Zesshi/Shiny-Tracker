const STATIC = 'static-v3';
const DATA = 'data-v3';
const SPRITES = 'sprites-v3';

const APP_SHELL = [
  '/', '/manifest.webmanifest',
  '/gen/gen1.jpg','/gen/gen2.jpg','/gen/gen3.jpg',
  '/gen/gen4.jpg','/gen/gen5.jpg','/gen/gen6.jpg',
  '/gen/gen7.jpg','/gen/gen8.jpg','/gen/gen9.jpg',
];


self.addEventListener('install', (e) => {
    e.waitUntil((async () => {
        const c = await caches.open(STATIC);
        await c.addAll(APP_SHELL);
        // cache the pokemon list
        const d = await caches.open(DATA);
        await d.add('/_next/static/chunks/webpack.js').catch(() => { });
        await d.add('/src/data/pokemon.json').catch(() => { }); // try dev path
        await d.add('/data/pokemon.json').catch(() => { });     // try prod path if copied
    })());
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => {
            if (![STATIC, DATA, SPRITES].includes(k)) return caches.delete(k);
        }));
    })());
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    if (/raw\.githubusercontent\.com\/PokeAPI\/sprites\/master\/sprites\/pokemon\//.test(url.href)) {
        e.respondWith((async () => {
            const cache = await caches.open(SPRITES);
            // use the URL string as the cache key so we can fetch with no-cors
            const cached = await cache.match(url.href, { ignoreVary: true });
            if (cached) return cached;
            try {
                const res = await fetch(url.href, { mode: 'no-cors', credentials: 'omit' });
                // opaque responses are fine for <img>; cache them as-is
                await cache.put(url.href, res.clone());
                return res;
            } catch {
                return cached || new Response('', { status: 503 });
            }
        })());
        return;
    }

    // stale-while-revalidate for our own HTML/JS/CSS and pokemon.json
    if (url.origin === self.location.origin) {
        e.respondWith((async () => {
            const cacheName = e.request.destination === 'document' ? STATIC : DATA;
            const c = await caches.open(cacheName);
            const cached = await c.match(e.request);
            const fetchPromise = fetch(e.request).then((res) => {
                if (res && res.status === 200) c.put(e.request, res.clone());
                return res;
            }).catch(() => cached);
            return cached || fetchPromise;
        })());
    }
});
