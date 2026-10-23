const CACHE = 'smarttap-pwa-v1';
const OFFLINE = '/offline.html';
const ASSETS = [OFFLINE, '/assets/app-icon-180.png', '/assets/app-icon-192.png', '/assets/app-icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('smarttap-pwa-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  // Never intercept API calls, Google login, writes or business data requests.
  // Online pages always use the network; no account or subscription data is cached.
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE)) ||
    new Response('SmartTap memerlukan internet. Sambungkan semula dan muat semula halaman.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })));
});
