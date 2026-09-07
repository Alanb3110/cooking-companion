# Cooking Companion — Technical Context Source

## Current implementation
Cooking Companion is a zero-backend static PWA for GitHub Pages and installed iPhone/Safari use.

The application uses vanilla HTML/CSS/JavaScript with native ES modules. No runtime framework, backend, account system or external API is required.

Conceptual layers:
1. recipe/content data;
2. pure/testable planning engine;
3. session state + persistence/orchestration;
4. UI rendering/interactions.

Independent settings, shopping and journal stores remain separate when their lifecycles differ from the active cook. `js/storage.js` centralizes safe storage access and user-facing unavailable/quota/conflict errors for the active session and journal.

## Application flow
Three top-level views:
1. `library` — illustrated recipes, qualification, app sharing, active-cook resume, DEV test-cook and Cook Journal;
2. `recipe` — servings/service time, scaled shopping, serving-aware advance prep/equipment and planner-derived recommended start;
3. `cook` — active plan plus optional temperature tracking.

State is local-first and designed to remain usable offline once required assets are cached.

## Library and qualification
`recipes/index.json` is the authoritative discovery manifest; every meal marked `available` is executable through the generic application pipeline.

Availability and culinary maturity are separate:
- `status: available` means the generic app pipeline can execute the recipe;
- `qualification` is `untested`, `test_cooked` or `validated` and reflects real-cook evidence only.

Current baseline:
- Pork Belly — `validated`;
- turkey/gratin and barbacoa — `test_cooked`;
- all other currently available meals — `untested` until representative real cooks are recorded.

See `sources/RECIPE_QUALIFICATION_V1.md`.

## Recipe/content and serving-aware instructions
Executable meals live under `recipes/*.json`. Recipe-specific timing/quantity rules must not be embedded in `app.js`.

`js/recipe.js` owns core validation, ingredient scaling and Woodfire summary formatting.

`js/step-details.js` owns structured `ingredientUsage` validation/materialization for two user-facing contexts:
- executable step summaries/details;
- `advancePrep[].details`.

Top-level ingredients remain authoritative for shopping totals. Local usage records are instructional metadata and do not independently aggregate shopping quantities.

`validateRecipeIngredientUsage()` validates both contexts before recipe use. `materializeRecipeForServings()` produces a detached serving-specific recipe view, while `materializeAdvancePrepForServings()` can be used directly by pre-cook rendering.

`js/recipe-loader.js` applies core recipe validation plus whole-recipe ingredient-usage validation.

Serving selection therefore stays coherent across shopping, night-before preparation and active-cook instructions.

## Current executable recipe set
The manifest exposes:
- Pork Belly Burnt Ends;
- roulé de dinde + gratin de courgettes;
- tacos barbacoa de bœuf fumée;
- saumon soja-miel + asperges + riz;
- poulet shawarma + pommes de terre + sauce yaourt;
- bœuf reverse-sear + grenailles + sauce poivre;
- wings miel-soja + potatoes + coleslaw;
- magret miel-soja-orange + patate douce;
- ribs BBQ + mac & cheese + coleslaw;
- halloumi + légumes + couscous;
- brochettes teriyaki + légumes + riz;
- poulet gochujang miel-soja + riz + concombre;
- bavette bulgogi + udon + crudités;
- filet mignon érable-moutarde-soja + couscous + haricots verts;
- saumon miso-miel + soba + pak choï;
- porc coréen effiloché au Woodfire;
- Egg Fried Rice générique, avec gochujang et porc coréen optionnels.

### Barbacoa V2
`recipes/smoked-beef-barbacoa.json` is content version 2.

V2 provides serving-aware quantities for advance marinade, salsa, braise, toppings and shells while preserving the established long-cook planning semantics. See `sources/BARBACOA_TACOS_MEAL.md`.

### Quick overnight-prep batch
Four recipes added on 2026-09-01 are optimized for a different real-use pattern: do most flavor preparation the previous evening and keep the next-day executable meal short.

They use the existing `advancePrep.ingredientUsage` mechanism and deliberately require no planner extension:
- gochujang chicken: GRILL 210 °C, 12–18 min cook window, 74 °C endpoint, 2–6 servings;
- bulgogi bavette: GRILL 230 °C, 8–12 min cook window + 3 min rest, 63 °C reference endpoint, 2–4 servings;
- maple/mustard/soy pork tenderloin: AIR FRY 200 °C, 18–25 min cook window + 3 min rest, 63 °C endpoint, 2–4 servings;
- miso/honey salmon: BAKE/ROAST 200 °C, 10–16 min cook window, 63 °C endpoint, 2–4 servings.

The serving caps are conservative so the advertised fast execution does not silently require another batch. All four are `untested`; their minute windows are estimates until real Woodfire cooks provide actual observations.

The four quick meals have dedicated local WebP food renders. Targeted regression tests ensure those assets remain valid, distinct from one another and do not regress to the previously reused covers.

See `sources/QUICK_OVERNIGHT_RECIPES_2026-09-01.md`.

### Korean pulled pork + generic Egg Fried Rice
The two new recipes intentionally remain separate.

`korean-pulled-pork-woodfire` is a standalone long cook based on the user-provided Korean pork card:
- 12–24 h overnight marinade;
- short smoke phase represented in the executable app as SMOKER 120 °C with smoke ON and pellets loaded;
- GRILL 240 °C browning;
- BAKE/ROAST 130 °C covered slow cooking;
- first tenderness check after 4 h 30, then 20 min rechecks;
- 94–95 °C plus near-resistance-free probe as the completion criterion;
- 30–45 min covered rest before shredding.

The original card described the smoke as optional/cold smoking. Because Recipe Schema V1 does not model optional executable branches and each Woodfire task must declare a setpoint, 120 °C is an explicit app adaptation rather than a literal source value.

`egg-fried-rice` is a generic stovetop recipe. It is fully executable without either optional add-in:
- base sauce: soy + rice vinegar/lime + sesame oil;
- optional gochujang: added to the same sauce, with only enough water to loosen if necessary;
- optional cooked Korean pulled pork: 150–250 g at the 2-serving reference, folded in near the end to reheat.

The user’s recollection is therefore materially correct: the gochujang version is the same fried-rice method with gochujang added to the sauce; the only practical adjustment is that water is mainly useful to loosen the paste and is not required for the classic sauce.

Options are currently represented through `optional: true` ingredients plus conditional prose. They do not alter the planner graph because neither option changes the actual execution sequence in a meaningful way.

See `sources/KOREAN_PORK_EGG_FRIED_RICE.md`.

## Sharing V1
The library exposes a `Partager l’app` action without adding a backend, account or analytics dependency.

`js/share.js` owns pure URL/payload handling plus the browser capability fallback:
- primary path: `navigator.share(...)`, giving iPhone/Safari/PWA the native share sheet;
- fallback: copy the canonical public app URL to the clipboard and show a short status toast;
- an `AbortError` from the native share sheet is treated as deliberate cancellation and does not write to the clipboard.

The canonical share URL preserves the GitHub Pages application subpath while removing query parameters/fragments and normalizing a trailing `index.html` to the application directory.

V1 shares the application itself rather than introducing recipe-specific deep-link routing. The share control stays in the library and is intentionally absent from active-cook controls so it cannot compete with next/current actions during a cook.

No local user data is included in the share payload. Cook Journal entries, session state, shopping checks, settings and temperature logs remain local.

See `sources/SHARING_V1.md`.

## Generic multi-recipe acceptance
Every manifest entry with `status: available` is covered automatically; generic tests must not enumerate recipe ids.

At minimum CI verifies:
- manifest/recipe identity and qualification;
- core recipe + whole-recipe ingredient-usage validation;
- actionable top-level ingredient quantities;
- min/reference/max scaling and shopping generation;
- serving-aware advance prep with no unresolved `{{use:...}}` token;
- serving-materialized active schedule text with no unresolved token;
- dependency validity;
- Woodfire conflict freedom;
- unambiguous service milestone;
- local illustrated cover.

The quick overnight batch additionally has a recipe-specific regression suite that protects its qualification, safety targets/rest steps, Woodfire state, advertised quick cook windows and min/reference/max planner executability. Dedicated-cover tests protect the final four local renders. The Korean pork/fried-rice suite protects optional-ingredient semantics, long-cook state and min/reference/max executability.

See `sources/MULTI_RECIPE_CONTRACT.md`.

## Serving configuration and pre-cook
`js/shopping.js` owns pure shopping/prep data logic. `getAdvancePrep(recipe, servings)` materializes advance preparation for the selected servings using the same scaling semantics as active steps.

`js/prep-ui.js` passes the current serving selection into shopping and advance-prep rendering. Serving changes therefore update:
- shopping quantities;
- advance-prep quantities;
- active-cook quantities once the meal is scheduled.

Shopping state remains version-scoped under `woodfire-companion-shopping-v1` using `recipeId@recipeVersion`.

`recommendedStartFromPlan()` in `js/meal-planner.js` derives user-facing start guidance from the same generated plan used during cooking. `timing.elapsedRangeMin` remains descriptive metadata only.

Planner V1 does not synthesize batches or change duration automatically from servings; `servings.max` must stay within one credible execution structure.

## Planner V1
`js/planner.js` is the DOM-free low-level solver. `js/meal-planner.js` is the recipe-facing facade.

Planning inputs include:
- servings;
- `mealTime` or absolute `targetServingAt`;
- dependencies/lags;
- durations/ranges;
- planning buffers;
- resource reservations;
- explicit task delays;
- actual starts/completions;
- expected completion from pending rechecks.

Baseline planning works backwards from service. The Woodfire is currently the only automatically conflict-resolved exclusive resource. Other declared resources may run concurrently but are not generally conflict-solved.

Started/completed timestamps are historical facts and are never moved merely to make a plan tidy.

The solver supports dependency-only recipes without preferred offsets, midnight crossing, buffer absorption, runtime propagation and service slippage when reality can no longer meet the target.

## Active-cook orchestration
`js/active-cook-controller.js` owns DOM-free runtime orchestration:
- schedule recomputation;
- step start/finish/reset;
- observation/recheck application;
- +5/+10/+15 next-action delays;
- planning reset;
- served-cook journal synchronization.

Runtime step states are `upcoming`, `active`, `done`. Pending rechecks remain actionable next steps and feed expected completion back into planning.

`app.js` remains top-level rendering/navigation wiring rather than the owner of these mutations.

## Session state V3
Active cook state remains under compatibility key `woodfire-companion-v1` with explicit schema migration.

`js/session.js` owns lifecycle, migration, timestamp correction and detached recipe snapshots. A new cook snapshots validated recipe content so a later deployment cannot silently alter an in-progress cook.

DEV test sessions use the same planner/session path, can temporarily back up a real session and never enter the real Cook Journal.

## Observations / rechecks
`js/observations.js` owns pure observation logic.

Not-ready observations keep the step incomplete and create a future recheck. Ready observations record actual completion. Pending recheck time is passed into planning so buffers may absorb limited delay before dependent work/service moves.

## Temperature tracking
Temperature tracking is optional per recipe.

`js/temperature.js` owns pure validation/data semantics; `js/temperature-ui.js` owns fast entry, target editing, samples, chart, undo/new-series and CSV export.

Manual logging remains value → Add/Enter → automatic timestamp. Measurements do not automatically complete recipe steps. No ETA is inferred from temperature slope.

Current executable temperature targets carry `temperature.guidanceId`. `sources/FOOD_SAFETY_TRACEABILITY_V1.md` resolves each id to an authoritative source, recipe coverage, jurisdiction and limitations; collagen/tenderness targets are explicitly not treated as universal safety minima. Legacy frozen snapshots without the field remain valid with a warning so an update cannot invalidate an active cook.

## Cook Journal V2
Cook history remains separate under `woodfire-companion-journal-v1`.

Journal entries retain recipe/version, servings, target/actual service, schedule, actual starts/completions, observations, delays, temperatures, rating and notes. Versioned local JSON backup/import validates before writing and merges by stable session id.

Session and journal reads distinguish empty, valid, unavailable and preserved-incompatible states. Writes abort with an actionable error when storage is unavailable/full or when existing raw data is corrupt/future-version; the pre-existing bytes are not replaced by a default payload. The application surfaces these failures in the main error region or the relevant journal control.

Raw real-cook feedback should be captured in the journal first; durable findings are promoted into recipe/source revisions and may justify qualification changes.

## PWA/offline
The service worker uses network-first fetch with offline fallback and a separate cache generation.

Application and cache generation identifiers are authoritative in `package.json`, `index.html` and `service-worker.js`. Rotate `CACHE_REVISION` whenever cached application or recipe content changes so a waiting worker prepares a separate generation through the normal conservative lifecycle.

No `skipWaiting()` is used: a new generation must not replace the worker controlling an already-open cook. It activates after existing controlled clients close.

Available recipe JSON and covers are discovered from `recipes/index.json`; individual recipe files are not hard-coded in the static shell list. Sharing JS/CSS and the storage helper remain part of the static shell because the library/cook UI needs them even after an offline launch.

## Testing and CI
Run:

```bash
npm ci
npm test
```

The deterministic planner matrix covers every available recipe, every integer serving count in range, baseline planning, 1/5/15/30/60/120 min actual-start/actual-completion/recheck delays and progressively frozen historical prefixes. Its current manifest-derived cardinality is 15,082 scenarios. Violations between two immutable historical facts are retained; all constraints involving at least one movable step must be resolved.

Storage-fault tests cover unavailable access, quota exhaustion, corrupt JSON, future schemas and invalid backup input with byte-for-byte no-overwrite assertions.

GitHub Actions also installs Playwright's Mobile WebKit runtime and runs the critical library → configuration → DEV cook → recheck/step/temperature → reload → service-worker cached fetch under emulated offline mode → journal-import flow:

```bash
npm run test:e2e
```

This browser smoke test verifies integration and mobile-WebKit behavior, but does not qualify an installed iPhone PWA, screen locking, background suspension or a multi-hour real cook.

## Current technical priorities
1. Keep source contracts synchronized with merged behavior.
2. Keep the stabilization baseline green: planner stress, storage failures, safety traceability and Mobile WebKit smoke.
3. Qualify the executable library progressively through installed-iPhone real cooks, including Korean pulled pork / Egg Fried Rice as a likely near-term cook.
4. Use real cooks to decide whether flexible windows, non-Woodfire conflicts, explicit option toggles, batching or external components are needed.
5. Continue small `app.js` extractions only where ownership becomes materially unclear.
6. Complete safe branch cleanup and protect `main` with CI if repository settings allow it.
7. Periodically validate PWA update/offline behavior on installed iPhone.
8. Add predictive ETA only later from clean history with explicit uncertainty.

## Relevant source contracts
- `sources/PRODUCT_SPEC.md`;
- `sources/RECIPE_MODEL.md`;
- `sources/RECIPE_SCHEMA_V1.md`;
- `sources/FOOD_SAFETY_TRACEABILITY_V1.md`;
- `sources/RECIPE_QUALIFICATION_V1.md`;
- `sources/IPHONE_PWA_QUALIFICATION_V1.md`;
- `sources/STEP_INGREDIENT_USAGE_V1.md`;
- `sources/SHOPPING_PREP.md`;
- `sources/QUICK_OVERNIGHT_RECIPES_2026-09-01.md`;
- `sources/KOREAN_PORK_EGG_FRIED_RICE.md`;
- `sources/SHARING_V1.md`;
- `sources/MULTI_RECIPE_CONTRACT.md`;
- `sources/PLANNER_V1.md`;
- `sources/ACTIVE_COOK_V1.md`;
- `sources/OBSERVATIONS_V1.md`;
- `sources/SESSION_V3.md`;
- `sources/COOK_JOURNAL_V2.md`;
- `sources/JOURNAL_BACKUP_V1.md`.
