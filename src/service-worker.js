self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  
  // Do not cache API calls to Supabase or other external services
  if (url.host.includes('supabase')) return

  event.respondWith(
    caches.open('setflow-assets-v1').then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          cache.put(event.request, networkResponse.clone())
          return networkResponse
        }).catch(() => {}) // Ignore network errors and rely on cache
        return cachedResponse || fetchPromise
      })
    })
  )
})
