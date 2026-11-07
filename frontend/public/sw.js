// Dhruv Pharma Progressive Web App (PWA) Service Worker
const CACHE_NAME = 'dhruv-pharma-v1.1'
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/apple-touch-icon.png',
]

// 1. Install Event: Precache App Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW] Precache asset fetch error (non-fatal):', err)
            })
        }).then(() => self.skipWaiting())
    )
})

// 2. Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key)
                    }
                })
            )
        }).then(() => self.clients.claim())
    )
})

// 3. Fetch Strategy:
// - API calls: Network ONLY / Network First (so stock, batch, price lock, & invoices are always 100% fresh)
// - Static App Shell / Assets: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Never cache API calls, SSE streams, or file uploads
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads') || request.method !== 'GET') {
        return
    }

    // Navigation requests (HTML pages)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match('/index.html') || caches.match('/')
            })
        )
        return
    }

    // Static Assets (CSS, JS, Fonts, Images)
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached version immediately, but fetch fresh copy in background
                fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse))
                    }
                }).catch(() => {})
                return cachedResponse
            }

            return fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone()
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache))
                }
                return networkResponse
            })
        })
    )
})

// Listen for update message
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})
