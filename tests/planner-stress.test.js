import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildMealSchedule } from '../js/meal-planner.js';
import { findDependencyIssues, findResourceConflicts, scheduleMap } from '../js/planner.js';

const library = JSON.parse(await readFile(new URL('../recipes/index.json', import.meta.url), 'utf8'));
const availableEntries = library.recipes.filter(entry => entry.status === 'available');
const targetServingAt = new Date(2026, 8, 2, 20, 0, 0, 0);
const delaysMin = [1, 5, 15, 30, 60, 120];

function recipeFileUrl(recipeUrl) {
  return new URL(`../${recipeUrl.replace(/^\.\//, '')}`, import.meta.url);
}

function shiftedIso(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000).toISOString();
}

function fixedConstraintIssues(recipe, schedule, fixedStepIds = new Set()) {
  const dependencyIssues = findDependencyIssues(recipe, schedule)
    .filter(issue => !(fixedStepIds.has(issue.stepId) && fixedStepIds.has(issue.dependencyStepId)));
  const resourceConflicts = findResourceConflicts(schedule, 'woodfire')
    .filter(conflict => !conflict.stepIds.every(stepId => fixedStepIds.has(stepId)));
  return { dependencyIssues, resourceConflicts };
}

function assertMovableConstraints(recipe, schedule, fixedStepIds, label) {
  const { dependencyIssues, resourceConflicts } = fixedConstraintIssues(recipe, schedule, fixedStepIds);
  assert.deepEqual(dependencyIssues, [], `${label}: movable dependency violation`);
  assert.deepEqual(resourceConflicts, [], `${label}: movable Woodfire conflict`);
}

test('planner stress matrix preserves facts and resolves every movable constraint', async () => {
  let scenarioCount = 0;

  for (const entry of availableEntries) {
    const recipe = JSON.parse(await readFile(recipeFileUrl(entry.recipeUrl), 'utf8'));

    for (let servings = recipe.servings.min; servings <= recipe.servings.max; servings += 1) {
      const context = { servings, targetServingAt };
      const baseline = buildMealSchedule(recipe, context);
      const baselineById = scheduleMap(baseline);
      const prefixOrder = [...baseline].sort((a, b) => a.start - b.start || a.end - b.end);
      const baseLabel = `${recipe.id}/${servings} servings`;

      assertMovableConstraints(recipe, baseline, new Set(), `${baseLabel}/baseline`);
      scenarioCount += 1;

      for (const item of baseline) {
        for (const delayMin of delaysMin) {
          const actualStart = shiftedIso(item.start, delayMin);
          const startSchedule = buildMealSchedule(recipe, {
            ...context,
            actualStartTimes: { [item.step.id]: actualStart }
          });
          assert.equal(
            scheduleMap(startSchedule)[item.step.id].start.toISOString(),
            actualStart,
            `${baseLabel}/${item.step.id}/actual-start+${delayMin}: historical start moved`
          );
          assertMovableConstraints(
            recipe,
            startSchedule,
            new Set([item.step.id]),
            `${baseLabel}/${item.step.id}/actual-start+${delayMin}`
          );
          scenarioCount += 1;

          const actualCompletion = shiftedIso(item.end, delayMin);
          const completionSchedule = buildMealSchedule(recipe, {
            ...context,
            actualCompletionTimes: { [item.step.id]: actualCompletion }
          });
          assert.equal(
            scheduleMap(completionSchedule)[item.step.id].end.toISOString(),
            actualCompletion,
            `${baseLabel}/${item.step.id}/actual-end+${delayMin}: historical completion moved`
          );
          assertMovableConstraints(
            recipe,
            completionSchedule,
            new Set([item.step.id]),
            `${baseLabel}/${item.step.id}/actual-end+${delayMin}`
          );
          scenarioCount += 1;

          const expectedCompletion = shiftedIso(item.end, delayMin);
          const recheckSchedule = buildMealSchedule(recipe, {
            ...context,
            expectedCompletionTimes: { [item.step.id]: expectedCompletion }
          });
          assert.ok(
            scheduleMap(recheckSchedule)[item.step.id].end >= new Date(expectedCompletion),
            `${baseLabel}/${item.step.id}/recheck+${delayMin}: expected completion was shortened`
          );
          assertMovableConstraints(
            recipe,
            recheckSchedule,
            new Set(),
            `${baseLabel}/${item.step.id}/recheck+${delayMin}`
          );
          scenarioCount += 1;
        }
      }

      const actualStartTimes = {};
      const actualCompletionTimes = {};
      const fixedStepIds = new Set();
      for (let index = 0; index < prefixOrder.length; index += 1) {
        const item = prefixOrder[index];
        const historicalDelayMin = Math.min(30, (index + 1) * 5);
        actualStartTimes[item.step.id] = shiftedIso(item.start, historicalDelayMin);
        actualCompletionTimes[item.step.id] = shiftedIso(item.end, historicalDelayMin);
        fixedStepIds.add(item.step.id);

        const prefixSchedule = buildMealSchedule(recipe, {
          ...context,
          actualStartTimes,
          actualCompletionTimes
        });
        const prefixById = scheduleMap(prefixSchedule);
        for (const stepId of fixedStepIds) {
          assert.equal(
            prefixById[stepId].start.toISOString(),
            actualStartTimes[stepId],
            `${baseLabel}/fixed-prefix-${index + 1}/${stepId}: historical start moved`
          );
          assert.equal(
            prefixById[stepId].end.toISOString(),
            actualCompletionTimes[stepId],
            `${baseLabel}/fixed-prefix-${index + 1}/${stepId}: historical completion moved`
          );
        }
        assertMovableConstraints(
          recipe,
          prefixSchedule,
          fixedStepIds,
          `${baseLabel}/fixed-prefix-${index + 1}`
        );
        scenarioCount += 1;
      }

      for (const item of baseline) {
        assert.ok(baselineById[item.step.id], `${baseLabel}: missing baseline step ${item.step.id}`);
      }
    }
  }

  assert.equal(scenarioCount, 22_672, 'Update the documented stress-matrix cardinality when the library changes.');
});
