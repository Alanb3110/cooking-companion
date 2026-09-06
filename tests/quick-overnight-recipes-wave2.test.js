import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const library = JSON.parse(await readFile(new URL('../recipes/index.json', import.meta.url), 'utf8'));

const wave2Ids = [
  'char-siu-pork-rice-cucumber',
  'chicken-satay-coconut-rice',
  'tandoori-chicken-basmati-raita',
  'korean-grilled-pork-rice-slaw',
  'galbi-short-ribs-rice-cucumber',
  'teriyaki-beef-skewers-rice-edamame',
  'mild-jerk-chicken-rice-peas',
  'smoked-honey-garlic-chicken-couscous',
  'woodfire-chicken-fajitas',
  'maple-paprika-pork-steaks-potatoes'
];

async function loadRecipe(entry) {
  return JSON.parse(await readFile(new URL(`../${entry.recipeUrl.replace(/^\.\//, '')}`, import.meta.url), 'utf8'));
}

test('second overnight-prep wave is published as ten untested available meals', () => {
  const entries = wave2Ids.map(id => library.recipes.find(entry => entry.id === id));
  assert.equal(entries.length, 10);
  for (const [index, entry] of entries.entries()) {
    assert.ok(entry, `${wave2Ids[index]} missing from recipes/index.json`);
    assert.equal(entry.status, 'available');
    assert.equal(entry.qualification, 'untested');
    assert.ok(entry.visual?.imageUrl?.endsWith('.webp'));
    assert.ok(entry.activePrepMin <= 30, `${entry.id}: active prep should stay at or below 30 min.`);
    assert.ok(entry.elapsedRangeMin?.[1] <= 60, `${entry.id}: next-day elapsed estimate should stay at or below 60 min.`);
    assert.ok(entry.servings?.max <= 6, `${entry.id}: serving cap should remain conservative.`);
  }
});

test('every wave-two meal has explicit night-before prep and executable Woodfire work', async () => {
  for (const id of wave2Ids) {
    const entry = library.recipes.find(item => item.id === id);
    const recipe = await loadRecipe(entry);
    const advanceText = (recipe.advancePrep || []).flatMap(item => [item.title || '', item.timing || '', item.details || '']).join('\n');
    assert.match(advanceText, /veille/i, `${id}: no explicit night-before preparation.`);
    assert.ok(recipe.steps.some(step => step.resources?.includes('woodfire') && step.woodfire), `${id}: no structured Woodfire step.`);
  }
});

test('wave-two temperature contracts match the protein family', async () => {
  const poultry = new Set([
    'chicken-satay-coconut-rice',
    'tandoori-chicken-basmati-raita',
    'mild-jerk-chicken-rice-peas',
    'smoked-honey-garlic-chicken-couscous',
    'woodfire-chicken-fajitas'
  ]);

  for (const id of wave2Ids) {
    const entry = library.recipes.find(item => item.id === id);
    const recipe = await loadRecipe(entry);
    if (poultry.has(id)) {
      assert.equal(recipe.temperature.defaultTargetC, 74);
      assert.equal(recipe.temperature.guidanceId, 'FS-USDA-POULTRY-74C');
    } else {
      assert.equal(recipe.temperature.defaultTargetC, 63);
      assert.equal(recipe.temperature.guidanceId, 'FS-USDA-WHOLE-CUT-63C-3MIN');
    }
  }
});

test('smoked honey-garlic chicken explicitly enables smoke and pellets only for its smoke phase', async () => {
  const entry = library.recipes.find(item => item.id === 'smoked-honey-garlic-chicken-couscous');
  const recipe = await loadRecipe(entry);
  const smokeStep = recipe.steps.find(step => step.id === 'smoke-chicken');
  const finishStep = recipe.steps.find(step => step.id === 'finish-grill');

  assert.equal(smokeStep.woodfire.mode, 'SMOKER');
  assert.equal(smokeStep.woodfire.smoke, true);
  assert.equal(smokeStep.woodfire.pellets, true);
  assert.equal(finishStep.woodfire.mode, 'GRILL');
  assert.equal(finishStep.woodfire.smoke, false);
  assert.equal(finishStep.woodfire.pellets, false);
});
