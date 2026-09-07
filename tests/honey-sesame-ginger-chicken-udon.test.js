import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildMealSchedule } from '../js/meal-planner.js';
import { findDependencyIssues, findResourceConflicts } from '../js/planner.js';
import { validateRecipe } from '../js/recipe.js';

const recipe = JSON.parse(await readFile(new URL('../recipes/honey-sesame-ginger-chicken-udon.json', import.meta.url), 'utf8'));

test('honey-sesame chicken udon is an executable non-Woodfire wok meal', () => {
  const validation = validateRecipe(recipe);
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(recipe.temperature.guidanceId, 'FS-USDA-POULTRY-74C');

  const schedule = buildMealSchedule(recipe, {
    servings: 2,
    targetServingAt: new Date(2026, 8, 7, 20, 0, 0, 0)
  });
  assert.deepEqual(findDependencyIssues(recipe, schedule), []);
  assert.deepEqual(findResourceConflicts(schedule, 'woodfire'), []);

  const wokSteps = schedule.filter(item => item.step.resources.includes('wok'));
  assert.deepEqual(wokSteps.map(item => item.step.id), [
    'saute-vegetables',
    'cook-chicken',
    'glaze-chicken',
    'finish-udon-vegetables'
  ]);
  assert.ok(wokSteps.every(item => !item.step.woodfire));
  for (let index = 1; index < wokSteps.length; index += 1) {
    assert.ok(wokSteps[index - 1].end <= wokSteps[index].start, 'Wok steps must remain explicitly sequenced.');
  }

  const split = recipe.steps.find(step => step.id === 'make-and-split-sauce');
  assert.match(split.details.join(' '), /avant tout contact avec le poulet cru/i);
  assert.match(split.details.join(' '), /marinade.*jetée/i);
});
