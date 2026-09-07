import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildAppShareData, canonicalAppUrl, shareApp } from '../js/share.js';

const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const serviceWorker = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');
const shareCss = await readFile(new URL('../share.css', import.meta.url), 'utf8');

test('canonical app share URL preserves the GitHub Pages subpath and removes transient URL parts', () => {
  assert.equal(
    canonicalAppUrl('https://example.github.io/woodfire-companion/?recipe=test#section'),
    'https://example.github.io/woodfire-companion/'
  );
  assert.equal(
    canonicalAppUrl('https://example.github.io/woodfire-companion/index.html?x=1'),
    'https://example.github.io/woodfire-companion/'
  );
});

test('native share receives a clean Cooking Companion payload', async () => {
  let payload = null;
  const result = await shareApp({
    href: 'https://example.github.io/woodfire-companion/?debug=1',
    navigatorRef: { share: async data => { payload = data; } },
    documentRef: null
  });

  assert.equal(result.ok, true);
  assert.equal(result.method, 'native');
  assert.deepEqual(payload, buildAppShareData('https://example.github.io/woodfire-companion/?debug=1'));
  assert.equal(payload.url, 'https://example.github.io/woodfire-companion/');
});

test('share falls back to clipboard when native share is unavailable', async () => {
  let copied = null;
  const result = await shareApp({
    href: 'https://example.github.io/woodfire-companion/',
    navigatorRef: { clipboard: { writeText: async value => { copied = value; } } },
    documentRef: null
  });

  assert.equal(result.ok, true);
  assert.equal(result.method, 'clipboard');
  assert.equal(copied, 'https://example.github.io/woodfire-companion/');
});

test('cancelling the native share sheet does not trigger a clipboard side effect', async () => {
  let copied = false;
  const abort = new Error('cancelled');
  abort.name = 'AbortError';
  const result = await shareApp({
    href: 'https://example.github.io/woodfire-companion/',
    navigatorRef: {
      share: async () => { throw abort; },
      clipboard: { writeText: async () => { copied = true; } }
    },
    documentRef: null
  });

  assert.equal(result.method, 'cancelled');
  assert.equal(copied, false);
});

test('library exposes a mobile share button and status toast', () => {
  assert.match(indexHtml, /id="shareAppBtn"/);
  assert.match(indexHtml, />Partager l’app</);
  assert.match(indexHtml, /id="shareToast"/);
  assert.match(indexHtml, /src="\.\/js\/share\.js"/);
  assert.match(indexHtml, /href="\.\/share\.css"/);
  assert.match(shareCss, /\.share-toast/);
});

test('sharing UI is part of the offline shell', () => {
  assert.match(serviceWorker, /'\.\/share\.css'/);
  assert.match(serviceWorker, /'\.\/js\/share\.js'/);
  assert.match(serviceWorker, /const CACHE_REVISION = '[^']+';/);
});
