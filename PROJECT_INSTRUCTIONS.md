# Cooking Companion — Project Instructions

## Mission
Cooking Companion is a mobile-first, multi-equipment cooking copilot. It turns a chosen meal into an executable plan that gets the whole meal ready near the desired serving time.

The Ninja Woodfire remains a first-class supported appliance with its detailed configuration and exclusive-resource handling. It is not a prerequisite: a recipe may use a wok, pan, saucepan, oven, fridge or passive preparation, alone or in parallel with Woodfire work.

The product is not primarily a recipe reader. Its differentiator is the orchestration layer between structured recipe content and real cooking.

Canonical flow:

**recipe library → meal configuration → shopping/prep → generated plan → active cook → cook journal**

## Product principles
1. **Execution first.** During cooking, show what to do now, what happens next and, when applicable, the exact appliance configuration.
2. **Whole-meal planning.** Include main, sides, sauces, stovetop work, chilling, resting, plating and advance preparation.
3. **Few taps.** Frequent actions should take 1–3 taps. Temperature logging must remain extremely fast.
4. **Mobile first.** Installed iPhone/PWA is the reference UX; desktop is secondary.
5. **Offline capable.** Recipe viewing, planning, active cooking and logging must work without network access once assets are cached.
6. **Structured content.** Recipes live in reusable structured data, not UI code.
7. **Dependency-aware scheduling.** Plans derive from durations, dependencies, resource constraints, buffers and serving time rather than fixed offsets.
8. **Adaptive rather than brittle.** Actual starts/completions, observations and temperature may change the remaining plan.
9. **Explicit hardware state.** Woodfire steps specify mode, setpoint, smoke on/off, pellets, support/accessory, covered/uncovered and relevant placement.
10. **Food quality over false punctuality.** Completion criteria override an arbitrary clock target.
11. **Simple architecture first.** Keep the static GitHub Pages/PWA model until a backend solves a demonstrated need.

## Reference user journey
### 1. Library
Show illustrated recipe/meal cards with total time, active preparation time, difficulty, serving range, relevant equipment/modes and culinary qualification.

`recipes/index.json` separates:
- `status` — executability (`available` / `coming_soon`);
- `qualification` — real-cook maturity (`untested` / `test_cooked` / `validated`).

An `available` recipe may still be `untested`. Automated planner/schema/offline tests do not constitute culinary validation. See `sources/RECIPE_QUALIFICATION_V1.md`.

### 2. Meal configuration
User selects:
- number of servings;
- desired serving time;
- optional components/variants when explicitly supported.

### 3. Pre-cook output
Generate:
- scaled ingredients;
- categorized shopping checklist;
- advance-preparation requirements;
- equipment/accessory list;
- calculated recommended start;
- full schedule.

### 4. Planning
Each planned step carries, where relevant:
- scheduled time/window;
- concise summary and expandable detail;
- expected duration/range;
- dependencies;
- resource requirements;
- completion criterion;
- optional planning buffer/recheck behavior.

The planner permits useful parallel work. The Ninja Woodfire is currently the only automatically conflict-resolved exclusive resource; oven/stovetop/fridge/passive work may coexist but are not generally conflict-solved yet.

### 5. Active cook
Prioritize:
1. next action + countdown;
2. current active step;
3. current appliance configuration, including exact Woodfire settings where applicable;
4. completion/observation controls;
5. rapid temperature entry when enabled;
6. detailed instructions on demand;
7. upcoming steps.

Steps use `upcoming → active → done`, with separate actual start and completion timestamps. Some phases end by observation rather than timer alone. Pending rechecks feed back into the planner.

Actual step/control timestamps remain editable so a late tap can be corrected without converting a historical fact into an arbitrary delay.

### 6. Journal
Retain completed sessions locally with recipe/version, servings, planned vs actual timing, observations, temperature samples and notes/rating.

Raw real-cook feedback belongs in the journal first. Durable findings should then be promoted into curated recipe/source revisions and may justify a qualification change.

## Current implementation maturity
The project is beyond the original POC.

Merged foundation includes:
- illustrated manifest-driven multi-recipe library;
- every `available` meal declared in `recipes/index.json` is executable through the generic app pipeline;
- servings and serving-time configuration;
- scaled ingredients + shopping/prep;
- planner-derived recommended start;
- dependency-aware Planner V1 with buffers and Woodfire conflict resolution;
- actual starts/completions, explicit next-action delays and observation rechecks;
- DOM-free active-cook controller;
- optional temperature tracking;
- versioned session migration and frozen recipe snapshots;
- Cook Journal V2 with feedback and JSON backup/restore;
- conservative service-worker update lifecycle for long cooks;
- generic CI acceptance for every `available` recipe.

The primary product risk is now real-cook qualification and field usability, not construction of the basic scheduling engine.

Current qualification baseline:
- Pork Belly Burnt Ends — `validated` after a documented real-cook refinement loop;
- turkey + zucchini gratin — `test_cooked`;
- smoked beef barbacoa — `test_cooked`;
- every other currently `available` meal — `untested` until representative real cooks are recorded.

## Architecture
Maintain four conceptual layers:
1. recipe/content data;
2. pure/testable planning engine;
3. session/persistence/orchestration;
4. UI rendering/interactions.

Key ownership boundaries:
- `planner.js` — low-level pure solver;
- `meal-planner.js` — recipe-facing planning facade;
- `active-cook-controller.js` — active-cook state orchestration without DOM;
- `session.js` — schema migration/lifecycle/snapshots;
- `observations.js`, `temperature.js`, `journal.js`, `shopping.js` — pure/domain logic where practical;
- `app.js` and UI modules — rendering and user interaction.

Do not reintroduce recipe-specific timing/quantity rules into `app.js`.

Prefer vanilla HTML/CSS/JS while manageable. Do not introduce accounts, backend, paid APIs, runtime AI, framework or hardware integration without demonstrated product need.

## Recipe/content strategy
Use a hybrid model:
- curated structured recipes live in the repo;
- new recipes may be authored externally then validated/committed;
- the application never requires runtime AI/API access to execute a meal.

Before adding recipe count, prefer qualifying the existing diverse library unless the new meal fills a genuine household/product need or exercises a planner limitation not already represented.

## Recipe-writing rules
For every recipe:
- metric units by default;
- defined reference/min/max servings;
- explicit quantity scaling semantics; do not assume everything scales linearly;
- structured `step.ingredientUsage` where active-cook quantities depend on selected servings;
- preparation, cooking, resting, finishing and service separated;
- Woodfire settings explicit for every relevant phase;
- temperature targets only where meaningful;
- sensory/tenderness criteria where time/temperature alone is insufficient;
- placement/spacing/covering/liquid-level instructions where relevant;
- no contradiction between overview, ingredient quantities, timeline and active-cook cards;
- user-facing ingredients expose actionable baseline quantities/ranges rather than only `au goût`;
- safety-critical temperature/storage statements are verified against current authoritative guidance before becoming fixed application rules;
- current executable temperature targets carry a stable `temperature.guidanceId` resolved in `sources/FOOD_SAFETY_TRACEABILITY_V1.md`; preserve compatibility with frozen legacy snapshots that predate this metadata.

Known household defaults are preferences, not universal recipe facts: generous sauces, sweet-savoury profiles welcome, thyme generally avoided, alcohol/flambé avoided unless explicitly requested.

## Planner maturity
### Planner V1 — implemented
- serving-time anchor;
- durations/ranges;
- dependencies;
- planning buffers;
- Woodfire resource conflict resolution;
- parallel work;
- actual starts/completions;
- pending-recheck expected completion;
- dependency-aware replanning and service slippage;
- midnight handling.

Planner V1 does not yet:
- conflict-solve every non-Woodfire resource;
- synthesize batches/capacity changes from servings;
- infer ETA from temperature/history.

Do not extend these areas until real meals prove the need.

## Persistence / update safety
- Version storage schemas and migrate existing local data where practical.
- Preserve existing active-cook data across application changes.
- Freeze each active cook on a detached recipe snapshot.
- Keep shopping/settings/journal stores separate when lifecycles differ.
- Service-worker updates must not force a new application generation over an already-open long cook.
- Product renames do not justify renaming existing localStorage, journal, shopping, settings or cache identifiers. Preserve compatibility unless an explicit migration is implemented and tested.

## Development rules
- Read relevant `sources/*.md` plus current GitHub state before significant changes.
- Start meaningful work from current `main` on focused branches/PRs.
- Do not mix major planner refactors, broad visual redesigns and content waves unnecessarily.
- Add/update automated tests for changed behavior/contracts.
- Keep the deterministic planner stress matrix and Mobile WebKit smoke path green; neither substitutes for installed-iPhone field qualification.
- Use `sources/IPHONE_PWA_QUALIFICATION_V1.md` for physical-device release evidence; automation alone must not mark the installed PWA as qualified.
- Keep generic recipe acceptance manifest-driven; do not enumerate recipe ids there.
- Update source docs whenever product semantics, recipe/schema/planner/storage behavior changes.
- Test meaningful UX/PWA changes on installed iPhone/Safari; Node/static tests are necessary but not sufficient.

## Current priorities
1. Keep README/source contracts synchronized with merged code.
2. Keep the stabilization baseline green: storage-fault preservation, safety traceability, exhaustive planner scenarios and Mobile WebKit smoke coverage.
3. Qualify the executable library through representative real cooks across distinct planner patterns:
   - fast temperature-driven + parallel work;
   - genuine Woodfire resource conflict;
   - long tenderness/recheck meal.
4. Feed journal observations into recipe revisions and qualification changes.
5. Complete stale-branch cleanup and protect `main` with CI if repository settings allow it.
6. Continue small `app.js` extractions only when ownership becomes materially unclear.
7. Add flexible windows, non-Woodfire conflict solving, reusable external components or batching only when real meals demonstrate the need.
8. Defer predictive ETA until enough clean cook history exists to express uncertainty honestly.

## Out of scope for the initial product
- accounts/cloud backend;
- social/community marketplace;
- runtime AI requirement;
- paid APIs;
- direct smart-probe/ESP32 integration;
- broad support for every cooking appliance.

When a choice is ambiguous, optimize for a real cook in progress: minimal cognitive load, explicit appliance state, robust timing and easy recovery from delays.
