# Cooking Companion — Multi-recipe acceptance contract

## Purpose
A recipe marked `available` in `recipes/index.json` is executable product content, not merely a library card. It must work through the complete local application flow without recipe-specific application code.

Executability is deliberately separate from culinary qualification. Passing this contract does **not** by itself promote a recipe beyond `qualification: untested`.

See `sources/RECIPE_QUALIFICATION_V1.md`.

## Manifest contract
For each `available` recipe, the manifest must include:
- stable `id`;
- `recipeUrl` resolving to committed local JSON;
- title/description/tags/difficulty/timing/serving metadata;
- local `visual.imageUrl` cover;
- one valid `qualification`: `untested`, `test_cooked` or `validated`.

`status` controls whether content is executable. `qualification` describes real-cook evidence only and must not change planner/session behavior.

## CI contract for every `available` recipe
The automated suite must verify that:
- `recipeUrl` resolves to committed JSON;
- manifest id/title/serving range agree with the recipe;
- the manifest carries valid qualification metadata;
- `validateRecipe()` accepts the recipe;
- structured ingredient usage validates across both active steps and advance preparation;
- every user-facing ingredient exposes an actionable baseline quantity/range rather than only `au goût`;
- ingredient scaling works at minimum, reference and maximum servings;
- shopping/pre-cook generation succeeds for those serving counts;
- serving-aware advance-prep materialization contains no unresolved `{{use:...}}` token;
- `buildMealSchedule()` generates a complete schedule at minimum, reference and maximum servings;
- generated active-step text contains no unresolved quantity token;
- declared dependencies are satisfied;
- the baseline has no unresolved Woodfire conflict;
- one unambiguous service milestone resolves for journal/session semantics;
- the executable cover is a committed local non-empty WebP asset.

Adding another recipe must not require changing a generic acceptance test that enumerates recipe ids.

Recipe-specific regression tests remain appropriate when an established timeline, quantity materialization or planner pattern is worth protecting.

## Qualification is not a CI result
Automated tests may establish that a recipe is technically executable but cannot prove:
- real Woodfire heat behavior;
- ingredient-size variability;
- practical timing realism;
- taste balance;
- ergonomic clarity during a real cook;
- whether a buffer/recheck interval is sufficient in practice.

Therefore CI must never automatically promote `untested → test_cooked → validated`.

Qualification changes require real-cook evidence as defined by `RECIPE_QUALIFICATION_V1.md`.

## Serving-aware instruction contract
Top-level ingredients remain authoritative for shopping totals.

When user-facing quantities depend on servings, structured `ingredientUsage` may be used in:
- active-cook step summary/details;
- `advancePrep[].details`.

Both contexts must use the same selected serving count. This prevents the shopping list from scaling while a marinade/prep reminder or active step remains silently fixed at reference servings.

This text materialization does not change Planner V1 duration, batching, dependency or resource semantics.

## Meal-planning context API
Recipe-facing integrations use:

`buildMealSchedule(recipe, context)`

rather than growing positional arguments on the low-level solver.

The context currently normalizes:
- `servings`;
- `mealTime` or absolute `targetServingAt`;
- `referenceDate` fallback;
- `taskShifts`;
- `actualStartTimes`;
- `actualCompletionTimes`;
- `expectedCompletionTimes` for pending observation rechecks;
- reserved future `selectedComponents`;
- reserved future `variants`.

When `targetServingAt` is supplied it is canonical and provides both calendar date and local service time, avoiding day ambiguity for long/resumed cooks.

`buildSchedule()` remains the low-level solver API. Capacity/batching logic may later sit behind `buildMealSchedule()` without forcing another application-wide API migration.

## Active-cook contract
Executable recipes use the same generic lifecycle:
- `upcoming` — no actual start recorded;
- `active` — actual start recorded, no completion yet;
- `done` — actual completion recorded.

Observation-enabled steps may create a pending recheck without completing the step. The pending recheck is a runtime planning constraint and may move downstream work when planning buffer is exhausted.

Actual step/control timestamps may be corrected after the fact. Corrections are historical facts and feed the same planner path as timestamps recorded live.

An active session stores a recipe snapshot so a later deployed content version cannot silently mutate a cook already in progress.

## Offline contract
`recipes/index.json` is the source of truth for executable recipe discovery.

The service worker preloads recipe JSON and local covers by reading the manifest and selecting entries with:

`status === "available"`

Do not add individual executable recipe or cover filenames to the static service-worker list.

Qualification does not change offline caching: an `untested` recipe with `status: available` is still executable and must remain available offline.

## V1 serving-capacity rule
Ingredient quantities and serving-aware instruction quantities may scale within `servings.min..max`, and the meal-planning context carries selected servings, but Planner V1 does not synthesize additional cooking batches or alter duration automatically from serving count.

Therefore `servings.max` must only advertise a quantity that can follow the same declared step/resource structure on the supported Woodfire setup. If more servings require another batch, vessel cycle or materially different timing, restrict the range until batching/capacity semantics are implemented.

## Current deliberate limitations
These are not blockers for the current executable library:
- components remain grouping semantics rather than independently swappable external modules;
- duplicate ingredient aggregation across external reusable components is not implemented;
- only `woodfire` is automatically conflict-resolved as an exclusive resource;
- non-Woodfire resources may run concurrently but are not generally conflict-solved;
- Planner V1 does not synthesize batches/capacity changes from servings;
- no predictive ETA is inferred from temperature slope/history.

Temperature tracking is already optional per recipe and is not a current blocker for recipe promotion.

## Rule for future recipe additions
Prefer extending schema/planner semantics only when a real meal cannot be represented faithfully. Do not add recipe-specific branches to `app.js` or `planner.js` merely to make one recipe pass.

Prefer qualifying existing diverse recipes through real cooks before expanding recipe count by default. A new recipe is most valuable when it either fills a real meal need or exposes a planner limitation that existing content cannot exercise.
