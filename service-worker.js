const APP_VERSION = '0.3.0-rc.1';
const CACHE_REVISION = 'overnight-wave2-1';
const CACHE_PREFIX = 'woodfire-companion-';
const CACHE_NAME = `${CACHE_PREFIX}${APP_VERSION}-${CACHE_REVISION}`;
const APP_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './prep.css',
  './journal.css',
  './observations.css',
  './share.css',
  './app.js',
  './js/active-cook-controller.js',
  './js/planner.js',
  './js/meal-planner.js',
  './js/recipe.js',
  './js/recipe-loader.js',
  './js/step-details.js',
  './js/library.js',
  './js/recipe-hero.js',
  './js/settings.js',
  './js/share.js',
  './js/shopping.js',
  './js/prep-ui.js',
  './js/journal.js',
  './js/journal-ui.js',
  './js/observations.js',
  './js/storage.js',
  './js/session.js',
  './js/timestamp-editor.js',
  './js/dev-tools.js',
  './js/temperature.js',
  './js/temperature-ui.js',
  './recipes/index.json',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

async function cacheAvailableRecipeContent(cache) {
  const response = await fetch('./recipes/index.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Recipe manifest preload failed (${response.status}).`);

  const library = await response.json();
  const contentUrls = (library.recipes || [])
    .filter(entry => entry.status === 'available' && entry.recipeUrl)
    .flatMap(entry => [entry.recipeUrl, entry.visual?.imageUrl].filter(Boolean));
  const uniqueUrls = [...new Set(contentUrls)];

  if (uniqueUrls.length) await cache.addAll(uniqueUrls);
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_ASSETS);
    await cacheAvailableRecipeContent(cache);
  })());
  // Do not call skipWaiting(): an update must not replace the worker that
  // controls an already-open multi-hour cook. The new worker activates after
  // existing controlled clients close, while its separate cache is prepared.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const obsoleteAppCaches = keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME);
    await Promise.all(obsoleteAppCaches.map(key => caches.delete(key)));
    // Claim is retained so a first installation can control the already-open
    // page as soon as activation is allowed. For updates, activation itself is
    // deferred by the normal service-worker lifecycle until old clients close.
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') return cache.match('./index.html');
        return Response.error();
      })
  );
});
