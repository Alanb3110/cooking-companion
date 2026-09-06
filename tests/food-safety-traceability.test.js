import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { plannedDurationMin } from '../js/planner.js';

const library = JSON.parse(await readFile(new URL('../recipes/index.json', import.meta.url), 'utf8'));
const traceability = await readFile(new URL('../sources/FOOD_SAFETY_TRACEABILITY_V1.md', import.meta.url), 'utf8');

function recipeFileUrl(recipeUrl) {
  return new URL(`../${recipeUrl.replace(/^\.\//, '')}`, import.meta.url);
}

const guidanceContracts = {
  'FS-USDA-POULTRY-74C': target => target === 74,
  'FS-USDA-WHOLE-CUT-63C-3MIN': target => target === 63,
  'FS-USDA-FISH-63C': target => target === 63,
  'CULINARY-COLLAGEN-TENDERNESS': target => target >= 90 && target <= 100
};

test('every current temperature target resolves to a documented guidance contract', async () => {
  for (const entry of library.recipes.filter(item => item.status === 'available')) {
    const recipe = JSON.parse(await readFile(recipeFileUrl(entry.recipeUrl), 'utf8'));
    if (recipe.temperature?.defaultTargetC === undefined) continue;

    const guidanceId = recipe.temperature.guidanceId;
    assert.ok(guidanceContracts[guidanceId], `${recipe.id}: unknown temperature.guidanceId ${guidanceId}.`);
    assert.ok(
      guidanceContracts[guidanceId](recipe.temperature.defaultTargetC),
      `${recipe.id}: ${recipe.temperature.defaultTargetC} °C contradicts ${guidanceId}.`
    );
    assert.match(traceability, new RegExp(`\\b${guidanceId}\\b`));
    assert.match(traceability, new RegExp(`\\b${recipe.id}\\b`));

    if (guidanceId === 'FS-USDA-WHOLE-CUT-63C-3MIN') {
      const restSteps = recipe.steps.filter(step => /repos/i.test([
        step.title,
        step.summary,
        step.completion?.description
      ].filter(Boolean).join(' ')));
      assert.ok(
        restSteps.some(step => plannedDurationMin(step) >= 3),
        `${recipe.id}: whole-cut 63 °C rule requires an explicit rest of at least 3 min.`
      );
    }
  }
});

test('rice cooling and reheating controls remain aligned with the traced FSA rule', async () => {
  const rice = JSON.parse(await readFile(new URL('../recipes/egg-fried-rice.json', import.meta.url), 'utf8'));
  const advanceText = (rice.advancePrep || []).map(item => item.details || '').join('\n');
  const executionText = rice.steps.flatMap(step => [step.summary || '', step.completion?.description || '', ...(step.details || [])]).join('\n');

  assert.match(advanceText, /1 h/);
  assert.match(advanceText, /24 h/);
  assert.match(advanceText, /qu’une seule fois/);
  assert.match(executionText, /fumant(?:s)? à cœur/);
  assert.match(traceability, /FS-FSA-RICE-COOL-REHEAT/);
  assert.match(traceability, /food-fact-checker#rice/);
});

test('traceability register keeps official temperature and marinade sources explicit', () => {
  assert.match(traceability, /fsis\.usda\.gov\/.*safe-temperature-chart/);
  assert.match(traceability, /fsis\.usda\.gov\/.*grilling-and-food-safety/);
  assert.match(traceability, /anses\.fr\//);
  assert.match(traceability, /2026-09-05/);
});
