# Cooking Companion — Recipe / Meal Data Model Source

## Status
This file describes the **implemented semantic model** used by the current application. Exact field validation details live in `sources/RECIPE_SCHEMA_V1.md`; planner behavior lives in `sources/PLANNER_V1.md`.

The model is deliberately split between:
- library/discovery metadata in `recipes/index.json`;
- executable meal content in `recipes/*.json`;
- runtime cook/session facts stored separately from curated recipe data.

## Library entry
A library entry is the user-facing discovery record.

Important fields include:
- stable `id` matching the recipe JSON;
- `status`: `available` or `coming_soon`;
- `qualification` for available recipes: `untested`, `test_cooked` or `validated`;
- local `recipeUrl`;
- title/description/tags/difficulty;
- serving and timing summary metadata;
- `visual.imageUrl` plus fallback theme/symbol/eyebrow.

`status` and `qualification` are independent:
- `available` means the generic app pipeline can execute the recipe;
- qualification describes real-cook evidence and never changes planner/session behavior.

See `sources/RECIPE_QUALIFICATION_V1.md`.

## Executable recipe / meal
The JSON recipe is a complete executable meal definition.

It contains:
- `schemaVersion` and stable `id`;
- content `version` retained by cook sessions;
- title/description/tags/difficulty;
- supported serving range;
- descriptive timing metadata;
- optional temperature-tracking capability with a stable guidance/traceability id for current targets;
- meal components;
- top-level ingredients;
- equipment/consumables;
- optional advance-prep items;
- executable planning steps;
- an unambiguous service milestone.

The active cook stores a detached recipe snapshot so later deployments cannot silently mutate a cook already in progress.

## Components
Components group one meal into coherent parts such as main, side, sauce and whole-meal finishing work.

Current components are embedded grouping semantics. They are not yet independently swappable external modules. Do not extract reusable component files until multiple real recipes demonstrate that the added complexity pays for itself.

## Ingredients
Top-level ingredients are authoritative for pre-cook and shopping totals.

Each ingredient may include:
- stable `id` and display name;
- numeric quantity, range or `null` where numeric precision would be misleading;
- unit;
- explicit scaling rule;
- shopping category;
- optional flag;
- preparation note.

Implemented scaling patterns include `linear`, `fixed`, `step`, `range` and `to_taste`.

Not every quantity should scale linearly. Meat geometry, pan capacity, minimum sauce volume, eggs, lemons and batch constraints may require fixed/step/range semantics.

For `available` recipes, user-facing ingredients must still expose an actionable baseline quantity/range; an ingredient list consisting only of `au goût` guidance is not acceptable executable content.

## Structured ingredient usage in instructions
Top-level shopping quantities are not sufficient when user-facing prose contains serving-sensitive quantities.

Local `ingredientUsage` records associate an instructional use with a top-level ingredient and optional use-specific quantity/scaling rule. Supported V1 contexts are:
- executable steps (`summary` / `details[]`);
- advance-prep items (`details`).

Text references local usage ids through `{{use:...}}` tokens. `js/step-details.js` validates and materializes those tokens for the selected serving count.

Rules:
- top-level ingredients remain authoritative for shopping totals;
- local usage is instructional metadata, not a second shopping aggregator;
- use structured quantities only where servings materially change the instruction;
- step and advance-prep text must contain no unresolved quantity tokens after materialization;
- changing unit requires an explicit converted quantity;
- local `step` breakpoints must cover `servings.max`.

This closes the mismatch where shopping could scale while a marinade/preparation reminder remained fixed at reference servings.

See `sources/STEP_INGREDIENT_USAGE_V1.md`.

## Advance preparation
`advancePrep` is pre-cook guidance, not hidden planner work.

An advance-prep item may include:
- stable id/title;
- timing guidance;
- details;
- optional flag;
- `ingredientUsage` for serving-sensitive preparation text.

`getAdvancePrep(recipe, servings)` materializes those quantities for the current configuration before rendering. If advance work needs dependencies/resources/replanning, model it as a real planner step instead.

## Step
A step is an executable planning unit rather than a paragraph of recipe prose.

A step may contain:
- stable `id`;
- owning component;
- title + concise collapsed summary;
- expanded instruction list;
- deterministic duration or duration range + planning duration;
- dependencies with relation and lag;
- resource reservations;
- structured Woodfire state;
- completion criterion;
- planning buffer semantics where appropriate;
- recheck behavior;
- step-local ingredient usage;
- service anchor metadata where relevant.

A nominal duration supports scheduling; the real completion criterion remains authoritative during cooking.

## Dependencies
Current dependency records express `after_finish` or `after_start` plus optional lag.

Recipe validation rejects missing references/cycles and anchored recipes with disconnected executable work where that would make planning ambiguous.

Runtime delays do not rewrite dependencies. The planner recomputes unfinished work from actual facts plus the same dependency graph.

## Resource semantics
Current resource vocabulary may include `woodfire`, `oven`, `stovetop`, `fridge` and `passive`.

The Woodfire is currently the only automatically conflict-resolved exclusive resource. Independent Woodfire branches are allowed; Planner V1 may choose their non-overlapping order without fake dependencies.

Other resources can be declared and may run concurrently, but are not generally conflict-solved yet. Add broader resource-capacity semantics only when real meals demonstrate the need.

## Structured Woodfire state
Every Woodfire reservation explicitly carries hardware state rather than relying on prose:
- mode;
- setpoint and optional acceptable temperature range;
- smoke on/off;
- pellets yes/no;
- support/accessory;
- covered/uncovered;
- placement/spacing guidance where relevant.

The active-cook UI derives the hardware summary from this structure.

## Completion criteria
Supported semantic patterns include manual/checkpoint, appearance, tenderness, temperature and combined/state-driven completion.

Safety-critical fixed temperatures are verified against authoritative current sources before encoding them as recipe rules. Current executable targets resolve through `temperature.guidanceId` into `sources/FOOD_SAFETY_TRACEABILITY_V1.md`; missing ids remain warning-only for frozen legacy snapshots so update safety is not weakened.

The same register separates safety minima from 92–95 °C collagen/tenderness targets, which are culinary endpoints rather than universal safety thresholds.

## Observation / recheck model
Observation-driven cooking is implemented.

A not-ready outcome records the observation, keeps the step incomplete, creates a future recheck and passes expected completion back into the planner. A ready outcome records actual completion and clears the pending recheck.

Planner buffers may absorb a limited recheck delay before dependent work/service moves.

## Planning semantics
The operational schedule is generated from constraints rather than a hard-coded timeline.

Planner inputs include:
- desired serving timestamp;
- step durations/ranges;
- dependencies/lags;
- planning buffers;
- Woodfire resource reservations;
- explicit user delays;
- actual starts/completions;
- expected completion from pending rechecks.

Legacy preferred-start offsets are no longer required by the Pork Belly reference. New recipes should express real relationships through dependencies/resources/buffers/service anchors rather than UI offsets.

See `sources/PLANNER_V1.md`.

## Serving capacity
Top-level ingredient quantities, advance-prep quantities and structured active-step quantities may scale within the declared serving range, but Planner V1 does not synthesize additional batches or automatically alter durations from servings.

Therefore `servings.max` must remain within one credible execution structure. If more servings require another Woodfire batch, additional vessel cycle or materially different timing, restrict the advertised range until batching semantics exist.

## Shopping/prep
Shopping/pre-cook generation uses selected servings and top-level ingredient data.

Current output includes:
- scaled categorized ingredients;
- optional markers;
- recipe-specific consumables;
- serving-aware advance-prep reminders where structured usage is declared;
- equipment/accessory requirements;
- planner-derived recommended start time.

Shopping check state is version-scoped by recipe content version so a changed recipe does not silently inherit stale checked items.

## Versioning and runtime separation
Three kinds of version/maturity information must not be conflated:
- `schemaVersion` — data contract version;
- recipe `version` — curated content version stored in cook history/snapshots;
- manifest `qualification` — real-cook maturity of current content/process.

Runtime facts such as actual starts/completions, observations, rechecks and measurements belong to the session/journal, not to curated recipe JSON.

## Validation gates
Before an entry becomes `available`, the generic contract verifies at least:
- unique/coherent ids and component ownership;
- valid serving bounds;
- ingredient/scaling structures;
- structured step **and advance-prep** quantity materialization;
- valid dependencies/no cycles;
- valid completion/recheck semantics;
- explicit Woodfire state/reservation consistency;
- resolvable service milestone;
- schedule generation at min/reference/max servings;
- no unresolved baseline Woodfire conflict;
- local illustrated cover;
- valid qualification metadata.

Passing these gates establishes technical executability only. Real-cook maturity follows `RECIPE_QUALIFICATION_V1.md`.
