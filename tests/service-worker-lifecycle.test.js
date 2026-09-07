import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const serviceWorker = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');

function evaluateServiceWorker({ caches, fetch = async () => { throw new Error('offline'); }, claim = async () => {} }) {
  const listeners = {};
  const context = vm.createContext({
    caches,
    fetch,
    URL,
    Response,
    console,
    self: {
      location: { origin: 'https://example.test' },
      clients: { claim },
      addEventListener(type, listener) {
        listeners[type] = listener;
      }
    }
  });
  vm.runInContext(serviceWorker, context);
  return {
    cacheName: vm.runInContext('CACHE_NAME', context),
    listeners
  };
}

test('service-worker updates do not force activation over an open cook', () => {
  assert.doesNotMatch(serviceWorker, /self\.skipWaiting\s*\(/);
  assert.match(serviceWorker, /const CACHE_REVISION = '[^']+'/);
  assert.match(serviceWorker, /CACHE_PREFIX = 'woodfire-companion-'/);
  assert.match(serviceWorker, /CACHE_NAME = `\$\{CACHE_PREFIX\}\$\{APP_VERSION\}-\$\{CACHE_REVISION\}`/);
});

test('activation still claims the current page when activation is allowed', () => {
  assert.match(serviceWorker, /self\.clients\.claim\s*\(\)/);
});

test('activation deletes only obsolete Cooking Companion caches', async () => {
  const deleted = [];
  let claimed = false;
  const caches = {
    keys: async () => [],
    delete: async key => { deleted.push(key); }
  };
  const evaluated = evaluateServiceWorker({
    caches,
    claim: async () => { claimed = true; }
  });
  caches.keys = async () => [evaluated.cacheName, 'woodfire-companion-old', 'another-app-v1'];

  let activation;
  evaluated.listeners.activate({ waitUntil: promise => { activation = promise; } });
  await activation;

  assert.deepEqual(deleted, ['woodfire-companion-old']);
  assert.equal(claimed, true);
});

test('offline fallback reads only from the current app cache', async () => {
  const matched = [];
  const currentCache = {
    match: async request => {
      matched.push(request.url || request);
      return new Response('cached asset');
    }
  };
  const caches = {
    open: async () => currentCache,
    match: async () => { throw new Error('global cache lookup must not be used'); }
  };
  const evaluated = evaluateServiceWorker({ caches });
  const request = { method: 'GET', mode: 'same-origin', url: 'https://example.test/app.js' };
  let responsePromise;

  evaluated.listeners.fetch({
    request,
    respondWith: promise => { responsePromise = promise; }
  });
  const response = await responsePromise;

  assert.equal(await response.text(), 'cached asset');
  assert.deepEqual(matched, ['https://example.test/app.js']);
});
