/**
 * Dermasis Remedies – Service Worker
 * Strategy: Cache-first for static assets, Network-first for API calls,
 * Stale-while-revalidate for images.
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE  = `dermasis-static-${CACHE_VERSION}`;
const IMAGE_CACHE   = `dermasis-images-${CACHE_VERSION}`;
const API_CACHE     = `dermasis-api-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192.png',
  '/pwa-512.png',
];

// ─── Install: pre-cache static shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const CURRENT_CACHES = [STATIC_CACHE, IMAGE_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: route-based caching strategies ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and devtools requests
  if (!url.protocol.startsWith('http')) return;

  // ── API requests: Network-first, fall back to cache ─────────────────────
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    if (url.hostname === self.location.hostname && url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirstStrategy(request, API_CACHE, 5000));
      return;
    }
  }

  // ── Cloudinary images: Stale-while-revalidate ────────────────────────────
  if (url.hostname.includes('cloudinary.com') || url.hostname.includes('res.cloudinary')) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // ── Google Fonts: Cache-first ────────────────────────────────────────────
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // ── Static assets (JS/CSS/fonts from same origin): Cache-first ──────────
  if (
    url.hostname === self.location.hostname &&
    (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font' ||
      request.destination === 'image')
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // ── Navigation (HTML): Network-first with offline fallback ──────────────
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }
});

// ─── Strategy helpers ─────────────────────────────────────────────────────────

/** Cache-first: serve from cache, fall back to network and cache the result. */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.status === 200) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

/** Stale-while-revalidate: serve cached immediately, update in background. */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}

/** Network-first with timeout, fall back to cache. */
async function networkFirstStrategy(request, cacheName, timeoutMs = 4000) {
  const cache = await caches.open(cacheName);

  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** Navigation strategy: Network-first, fall back to cached index.html. */
async function navigationStrategy(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match('/index.html');
    return cached || Response.error();
  }
}
