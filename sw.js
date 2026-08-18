const CACHE_NAME = 'mote-runtime-v5';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/branding/favicon/favicon.ico',
  '/branding/favicon/favicon-32x32.png',
  '/branding/app-icon-192-light.png',
  '/branding/app-icon-512-light.png',
  '/assets/icons/mote-icons.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') return caches.match('/');
        throw new Error('Offline and resource is not cached.');
      })
  );
});
