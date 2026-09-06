import { expect, test } from '@playwright/test';

test('mobile critical flow survives reload, verifies offline cache readiness and restores journal data', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('button.recipe-card').first()).toBeVisible();

  const weeknightFilter = page.getByRole('button', { name: /^Semaine ·/ });
  await expect(weeknightFilter).toBeVisible();
  await weeknightFilter.click();
  await expect(page.locator('.library-filter-summary')).toContainText('≤ 60 min');
  await expect(page.getByRole('button', { name: /Pork Belly Burnt Ends/i })).toBeHidden();
  await expect(page.getByRole('button', { name: /Egg Fried Rice/i })).toBeVisible();
  await page.getByRole('button', { name: /^Toutes ·/ }).click();

  await page.getByRole('button', { name: /Pork Belly Burnt Ends/i }).click();
  await expect(page.locator('#recipeTitle')).toContainText('Pork Belly Burnt Ends');
  const initialServings = Number(await page.locator('#servingsValue').textContent());
  await page.locator('#servingsPlusBtn').click();
  await expect(page.locator('#servingsValue')).toHaveText(String(initialServings + 1));
  await page.locator('#configMealHour').selectOption('20');
  await page.locator('#configMealMinute').selectOption('15');
  await expect(page.locator('#startTimeHint')).not.toBeEmpty();

  await page.locator('#backToLibraryBtn').click();
  const devCookButton = page.getByRole('button', { name: '🧪 Cuisson test' });
  await expect(devCookButton).toBeVisible();
  await devCookButton.click();

  await expect(page.locator('#testCookBanner')).toContainText('Mode test');
  const recheckCard = page.locator('.task-card.awaiting-recheck').first();
  await expect(recheckCard).toBeVisible();
  await recheckCard.locator('.task-details-btn').click();
  await expect(recheckCard.locator('.recheck-due')).toContainText('Recontrôle prévu');

  const finishCard = page.locator('.task-card[data-task-id="finish-pork"]');
  const finishCheckbox = finishCard.locator('.task-check');
  await finishCheckbox.click();
  await expect(finishCard).toHaveClass(/active/);
  await finishCheckbox.click();
  await expect(finishCard).toHaveClass(/completed/);

  await page.locator('.tab[data-tab="temperature"]').click();
  await page.locator('#temperatureInput').fill('88');
  await page.locator('#addTemperatureBtn').click();
  await expect(page.locator('#measurementCount')).toHaveText(/^4 mesures$/);

  await page.reload();
  await expect(page.locator('#testCookBanner')).toContainText('Mode test');
  await expect(page.locator('.task-card[data-task-id="finish-pork"]')).toHaveClass(/completed/);
  await page.locator('.tab[data-tab="temperature"]').click();
  await expect(page.locator('#measurementCount')).toHaveText(/^4 mesures$/);

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    return true;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const cachedRecipeCount = await page.evaluate(async () => {
    const manifestUrl = new URL('./recipes/index.json', window.location.href).href;
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      const response = await cache.match(manifestUrl);
      if (!response) continue;
      if (!response.ok) throw new Error(`Cached manifest returned ${response.status}.`);
      const manifest = await response.json();
      return manifest.recipes?.length || 0;
    }
    throw new Error('Recipe manifest is missing from CacheStorage.');
  });
  expect(cachedRecipeCount).toBeGreaterThan(0);

  await page.getByRole('button', { name: /Quitter le test|Restaurer ma cuisson/ }).click();
  await expect(page.locator('#libraryView')).toBeVisible();

  const servedAt = '2026-09-02T20:04:00.000Z';
  const backup = {
    kind: 'woodfire-companion-journal-backup',
    version: 1,
    exportedAt: '2026-09-02T21:00:00.000Z',
    journal: {
      schemaVersion: 2,
      entries: [
        {
          schemaVersion: 2,
          id: 'browser-smoke-cook',
          recipeId: 'browser-smoke-meal',
          recipeVersion: 1,
          recipeTitle: 'Repas du smoke test',
          servings: 4,
          targetMealTime: '20:00',
          targetServingAt: '2026-09-02T20:00:00.000Z',
          servedAt,
          updatedAt: servedAt,
          completed: { serve: servedAt },
          totalSteps: 1,
          measurements: [],
          observations: [],
          schedule: [],
          rating: null,
          notes: ''
        }
      ]
    }
  };
  await page.locator('.journal-backup-actions input[type="file"]').setInputFiles({
    name: 'woodfire-browser-smoke.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup))
  });
  await expect(page.locator('.journal-backup-status')).toContainText('1 cuisson importée');
  await expect(page.locator('.journal-card')).toContainText('Repas du smoke test');
});
