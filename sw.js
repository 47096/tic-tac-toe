const CACHE = 'ttt-v1';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never cache third-party SDK (Firebase / gstatic) — always fetch fresh
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Network-first for HTML pages — always get fresh when online, fall back to cache when offline
  if (
    e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').includes('text/html')
  ) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('./')))
    );
    return;
  }

  // Cache-first for same-origin assets (icons, manifest, etc.)
  e.respondWith(
    caches.match(e.request).then(
      (r) =>
        r ||
        fetch(e.request)
          .then((res) => {
            if (res.ok && e.request.method === 'GET') {
              const clone = res.clone();
              caches.open(CACHE).then((c) => c.put(e.request, clone));
            }
            return res;
          })
          .catch(() => caches.match('./'))
    )
  );
});
