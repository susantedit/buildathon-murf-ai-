// Service Worker for Vortex Voice AI
// Strategy: network-first for HTML, cache-first for static assets

const CACHE_VERSION = 'v4'
const CACHE_NAME = `vortex-voice-ai-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
]

// Install — pre-cache only static assets, skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => Promise.resolve())
    )
  )
  self.skipWaiting()
})

// Activate — delete ALL old caches, claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Never intercept cross-origin requests — let them go directly to network
  if (url.hostname !== self.location.hostname) return

  // Always go to network for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }

  // Network-first for HTML (navigation requests) — ensures latest app shell
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Cache-first for JS/CSS/images (Vite hashes these filenames, so stale = impossible)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
        }
        return res
      }).catch(() => caches.match('/index.html'))
    })
  )
})

// Allow manual skip-waiting from app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
