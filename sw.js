// Service Worker für die Finanzen-App
// Strategie: Netz zuerst (immer aktuellste Version, wenn online),
// Cache als Fallback (App funktioniert komplett offline).
// Diese Datei muss nach dem Einrichten nie wieder angefasst werden.

const CACHE = 'finanzen-cache-v1';
const ASSETS = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // nur eigene Dateien

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Frische Version im Hintergrund in den Cache legen
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() =>
        // Offline: aus dem Cache bedienen (Navigation → index.html)
        caches.match(req).then((hit) => hit || caches.match('./index.html'))
      )
  );
});
