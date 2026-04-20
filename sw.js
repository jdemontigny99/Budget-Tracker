/* BudgetFlow Service Worker — offline-first cache */
const CACHE = 'budgetflow-v1';
const ASSETS = ['./'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only intercept same-origin navigations & assets; let API calls (GitHub Gist) pass through
  const url = e.request.url;
  if (!url.startsWith(self.location.origin) || url.includes('api.github.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const clone = res.clone();
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});
