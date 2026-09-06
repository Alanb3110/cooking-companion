import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  LIBRARY_QUICK_FILTERS,
  filterLibraryEntries,
  matchesLibraryQuickFilter
} from '../js/library-filters.js';

const library = JSON.parse(await readFile(new URL('../recipes/index.json', import.meta.url), 'utf8'));
const available = library.recipes.filter(entry => entry.status === 'available');

function ids(filterId) {
  return filterLibraryEntries(library.recipes, filterId).map(entry => entry.id);
}

test('quick filters expose the intended one-tap browsing contexts', () => {
  assert.deepEqual(
    LIBRARY_QUICK_FILTERS.map(filter => filter.id),
    ['all', 'weeknight', 'overnight', 'long', 'smoked', 'tested']
  );
  assert.equal(ids('all').length, library.recipes.length);
});

test('weeknight means at most 60 min elapsed and 30 min active prep', () => {
  const weeknight = filterLibraryEntries(library.recipes, 'weeknight');
  assert.ok(weeknight.length >= 8, 'Library should offer a meaningful weeknight shortlist.');
  for (const entry of weeknight) {
    assert.equal(entry.status, 'available');
    assert.ok(entry.activePrepMin <= 30, `${entry.id}: active prep exceeds 30 min.`);
    assert.ok(entry.elapsedRangeMin[1] <= 60, `${entry.id}: elapsed range exceeds 60 min.`);
  }
  assert.ok(ids('weeknight').includes('egg-fried-rice'));
  assert.ok(ids('weeknight').includes('woodfire-chicken-fajitas'));
});

test('overnight filter is driven by explicit advance-prep tags', () => {
  const overnight = filterLibraryEntries(library.recipes, 'overnight');
  assert.ok(overnight.length >= 10, 'Overnight-prep recipes should remain a useful browse group.');
  for (const entry of overnight) {
    assert.match((entry.tags || []).join(' '), /Prépa (la veille|en avance)/i, entry.id);
  }
  assert.ok(ids('overnight').includes('char-siu-pork-rice-cucumber'));
  assert.ok(ids('overnight').includes('korean-pulled-pork-woodfire'));
});

test('long cook means an elapsed range reaching at least three hours', () => {
  const longCooks = filterLibraryEntries(library.recipes, 'long');
  assert.ok(longCooks.length >= 4);
  for (const entry of longCooks) assert.ok(entry.elapsedRangeMin[1] >= 180, entry.id);
  assert.ok(ids('long').includes('pork-belly-burnt-ends-meal'));
  assert.ok(ids('long').includes('smoked-beef-barbacoa'));
});

test('smoked and tested filters use explicit manifest metadata', () => {
  const smoked = filterLibraryEntries(library.recipes, 'smoked');
  assert.ok(smoked.length >= 4);
  assert.ok(smoked.every(entry => (entry.tags || []).includes('Fumé') || entry.visual?.eyebrow?.includes('SMOKER')));

  const tested = filterLibraryEntries(library.recipes, 'tested');
  assert.ok(tested.length >= 3);
  assert.ok(tested.every(entry => ['test_cooked', 'validated'].includes(entry.qualification)));
  assert.ok(tested.some(entry => entry.qualification === 'validated'));
});

test('unknown quick-filter ids safely fall back to all', () => {
  for (const entry of available) assert.equal(matchesLibraryQuickFilter(entry, 'does-not-exist'), true);
});

test('quick-filter controller and stylesheet stay in the offline shell', async () => {
  const worker = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');
  assert.match(worker, /\.\/js\/library-filters\.js/);
  assert.match(worker, /\.\/library-filters\.css/);
});
