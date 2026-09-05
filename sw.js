const CACHE = 'flip7-wtasRiG55Pjx8c79Yyl0J';
const ASSETS = ["/","/manifest.webmanifest","/icon.svg","/icon-192.png","/icon-512.png","/apple-touch-icon.png","/_next/static/chunks/0cz1d0mv5g_q7.js","/_next/static/chunks/1352at7ces29p.css","/_next/static/chunks/1mh6a-0e61pyc.js","/_next/static/chunks/2rrxkmlsg09cg.js","/_next/static/chunks/3fntmmi971322.js","/_next/static/chunks/3l04zcqx63h3y.js","/_next/static/chunks/41qfcvra0dvw4.js","/_next/static/chunks/turbopack-0_i3ve-33z88y.js","/_next/static/media/barlow_condensed_latin_700_normal-s.p.21s4tc4km7afu.woff2","/_next/static/media/dm_sans_latin_400_normal-s.p.0471snlmja818.woff2","/_next/static/media/dm_sans_latin_600_normal-s.p.0oone78si629l.woff2","/_next/static/media/dm_sans_latin_700_normal-s.p.1a6kzvi7en7g-.woff2","/_next/static/wtasRiG55Pjx8c79Yyl0J/_buildManifest.js","/_next/static/wtasRiG55Pjx8c79Yyl0J/_clientMiddlewareManifest.js","/_next/static/wtasRiG55Pjx8c79Yyl0J/_ssgManifest.js"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('flip7-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    if (event.request.mode === 'navigate') {
      try { return await fetch(event.request); }
      catch { return await cache.match('/'); }
    }
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (error) {
      if (event.request.mode === 'navigate') return await cache.match('/');
      throw error;
    }
  }));
});
