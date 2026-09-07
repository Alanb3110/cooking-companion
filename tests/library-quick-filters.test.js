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
    ['all', 'tonight', 'tomorrow-quick', 'tomorrow-long', 'long', 'smoked', 'tested']
  );
  assert.equal(ids('all').length, library.recipes.length);
});

test('tonight means at most 60 min elapsed and 30 min active prep', () => {
  const weeknight = filterLibraryEntries(library.recipes, 'tonight');
  assert.ok(weeknight.length >= 2, 'Library should offer immediate-cook meals without prior preparation.');
  for (const entry of weeknight) {
    assert.equal(entry.status, 'available');
    assert.ok(entry.activePrepMin <= 30, `${entry.id}: active prep exceeds 30 min.`);
    assert.ok(entry.elapsedRangeMin[1] <= 60, `${entry.id}: elapsed range exceeds 60 min.`);
    assert.doesNotMatch((entry.tags || []).join(' '), /Prépa (la veille|en avance)/i, `${entry.id}: requires advance preparation.`);
  }
  assert.deepEqual(ids('tonight'), ['egg-fried-rice', 'honey-sesame-ginger-chicken-udon']);
});

test('tomorrow filters distinguish a quick next-day cook from a long next-day cook', () => {
  const quickTomorrow = filterLibraryEntries(library.recipes, 'tomorrow-quick');
  const longTomorrow = filterLibraryEntries(library.recipes, 'tomorrow-long');
  assert.ok(quickTomorrow.length >= 8, 'Quick next-day recipes should remain a useful browse group.');
  assert.ok(longTomorrow.length >= 1, 'Long next-day recipes should remain discoverable.');
  for (const entry of [...quickTomorrow, ...longTomorrow]) {
    assert.match((entry.tags || []).join(' '), /Prépa (la veille|en avance)/i, entry.id);
  }
  assert.ok(quickTomorrow.every(entry => entry.activePrepMin <= 30 && entry.elapsedRangeMin[1] <= 60));
  assert.ok(longTomorrow.every(entry => entry.elapsedRangeMin[1] >= 180));
  assert.ok(ids('tomorrow-quick').includes('char-siu-pork-rice-cucumber'));
  assert.deepEqual(ids('tomorrow-long'), ['korean-pulled-pork-woodfire']);
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
