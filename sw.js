// Cache shell for offline; always revalidate code so HTML/CSS/JS never split.
const CACHE = 'ttt-v2';
const ASSETS = ['./', './index.html', './manifest.json'];

function isCode(req) {
  const path = new URL(req.url).pathname;
  return path.endsWith('.css') || path.endsWith('.js') || path.endsWith('.html') || path.endsWith('/');
}

function isImmutableAsset(req) {
  const path = new URL(req.url).pathname;
  return path.endsWith('.png') || path.endsWith('.svg') || path.endsWith('.webp') || path.endsWith('.ico') || path.endsWith('manifest.json');
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Third-party SDK (Firebase / gstatic) — always network
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(req));
    return;
  }

  // HTML / CSS / JS — network-first so a soft refresh never pairs new markup with old styles
  if (req.mode === 'navigate' || isCode(req)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match('./').then((home) => home || Response.error()))
        )
    );
    return;
  }

  // Icons / manifest — cache-first
  if (isImmutableAsset(req)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((c) => c.put(req, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  e.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || Response.error())));
});
