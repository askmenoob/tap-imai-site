const CACHE = 'smarttap-pwa-v3-brand';
const OFFLINE = '/offline.html';
const LANGUAGE = ['/language.js', '/language.css', '/language-catalog.mjs'];
const BRAND = ['/assets/smarttap-mark.png', '/assets/app-icon-maskable-512.png', '/assets/favicon-32.png', '/favicon.ico'];
const ASSETS = [OFFLINE, ...LANGUAGE, ...BRAND, '/assets/app-icon-180.png', '/assets/app-icon-192.png', '/assets/app-icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('smarttap-pwa-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if(request.method==='GET' && url.origin===self.location.origin && ASSETS.includes(url.pathname)){
    event.respondWith(fetch(request).catch(()=>caches.match(url.pathname)));return;
  }
  // Never intercept API calls, Google login, writes or business data requests.
  // Online pages always use the network; no account or subscription data is cached.
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE)) ||
    new Response('SmartTap memerlukan internet. Sambungkan semula dan muat semula halaman.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })));
});
