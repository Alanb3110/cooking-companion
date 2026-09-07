# Cooking Companion — Recipe Schema V1

## Status
Schema V1 is the executable recipe format used by the application. The canonical reference is `recipes/pork-belly-burnt-ends.json`.

The reference recipe is dependency-driven and contains no `preferredStartOffsetMin` placement fields.

## Top-level structure
A recipe/meal contains:
- `schemaVersion`;
- stable `id` and positive integer content `version`;
- `title`, description/visual metadata;
- `servings` with `min`, `reference`, `max`;
- optional `timing` and temperature metadata;
- optional `advancePrep`;
- `components`;
- `ingredients`;
- `equipment`;
- executable `steps`;
- optional explicit `serviceStepId`.

Serving bounds must satisfy:

`0 < min <= reference <= max`

Until Planner V1 supports batch synthesis, `max` must remain within a quantity that can follow the same declared execution/resource structure.

## Optional temperature tracking
Temperature logging is a recipe capability, not a universal application assumption.

Supported top-level semantics:

```json
"temperature": {
  "enabled": true,
  "defaultTargetC": 74,
  "guidanceId": "FS-USDA-POULTRY-74C"
}
```

Rules:
- no `temperature` object means temperature tracking is disabled;
- `temperature.enabled: false` explicitly disables tracking and must not also declare `defaultTargetC`;
- `temperature.enabled: true` requires `defaultTargetC` between 30 and 120 °C;
- for backward compatibility, an existing recipe with numeric `defaultTargetC` and no `enabled` flag is treated as enabled;
- current executable recipe data with a numeric target declares an uppercase `guidanceId` resolved in `sources/FOOD_SAFETY_TRACEABILITY_V1.md`;
- a legacy frozen cook snapshot without `guidanceId` remains valid and emits only a validation warning, preserving update safety;
- a step using `completion.type: "temperature"` requires enabled recipe temperature tracking with a valid target.

When tracking is disabled, Active Cook hides the temperature tab, stores no fabricated 93 °C target for a new session and redirects any stale `temperature` tab state back to Planning.

## Ingredients and scaling
Each ingredient has a stable `id`, display name, quantity/unit, scaling rule, shopping category and optional preparation note.

Quantity may be a number, `{ min, max }`, or `null` when numeric guidance would be misleading.

Supported scale types:
- `linear`;
- `fixed`;
- `step`;
- `range`;
- `to_taste`.

`step` breakpoints must use strictly increasing positive `maxServings` values and cover `servings.max`; otherwise scaling above the last declared breakpoint is rejected by validation.

Top-level ingredient quantities remain the source for the pre-cook ingredient/shopping view.

## Structured ingredient usage in instructions
User-facing instructions may optionally declare `ingredientUsage` when their text needs serving-sensitive quantities. This avoids hard-coding reference-serving amounts in prose while keeping shopping, pre-cook reminders and Active Cook aligned.

V1 supports structured usage on:
- executable `steps`: tokens may appear in `summary` and/or `details[]`;
- `advancePrep` records: tokens may appear in the string `details` field.

Example step:

```json
{
  "id": "potato-prep",
  "ingredientUsage": [
    {
      "id": "potato-salt",
      "ingredientId": "salt",
      "quantity": { "min": 5, "max": 7 },
      "unit": "g"
    }
  ],
  "details": [
    "Ajouter {{use:potato-salt}} de sel."
  ]
}
```

Example advance preparation:

```json
{
  "id": "marinate-ahead",
  "ingredientUsage": [
    { "id": "marinade-meat", "ingredientId": "meat" }
  ],
  "details": "Mariner {{use:marinade-meat}} de viande."
}
```

Rules:
- `ingredientUsage[].id` is unique inside its instruction item and is referenced as `{{use:<id>}}` in supported text;
- `ingredientId` must reference a top-level ingredient;
- usage quantity/unit/scale describe the amount used by that instruction at `servings.reference`;
- omitted quantity/unit/scale inherit the top-level ingredient values;
- changing the unit requires an explicit converted quantity;
- a usage may override the top-level scaling rule when the local representation needs different semantics;
- a usage-local `step` scale must cover `servings.max`;
- `displayUnit: false` may suppress the unit when prose supplies the noun itself, such as a lemon count;
- every declared usage must appear in supported item text and every `{{use:...}}` token must resolve to a declared usage.

`buildMealSchedule()` materializes step tokens for the selected serving count before Planner V1 builds the runtime schedule. Therefore Active Cook receives already-scaled summary/detail text.

`getAdvancePrep(recipe, servings)` materializes advance-prep tokens before the recipe/pre-cook UI renders those reminders.

These materializations do not change durations, dependencies or resource allocation.

`ingredientUsage` is instructional metadata only in V1. It does **not** automatically aggregate the shopping list or enforce conservation between usage entries and top-level ingredient totals; this is intentional because one physical ingredient may be represented in several ways and optional usage can make exact summation ambiguous.

See `sources/STEP_INGREDIENT_USAGE_V1.md`.

## Components
Components group ingredients and steps into meal parts such as main, side and sauce.

Component ids must be unique. A component has a type/title and may list `ingredientIds` and `stepIds`.

Step ownership is checked bidirectionally:
- a non-reserved `step.component` must exist;
- a step listed by a component must declare that component;
- a component-owned step must appear in that component's `stepIds`.

`meal` is a reserved step-level component identifier for whole-meal actions such as plating/service that do not belong to one reusable component.

Components remain embedded in one meal JSON until real reuse justifies external component files.

## Equipment and consumables
Reusable equipment/accessories use stable `id` + `name` and may be optional.

Recipe-specific non-food consumables may use `consumable: true` plus a display quantity. Consumables enter the shopping checklist and are excluded from reusable equipment.

## Advance preparation
`advancePrep` records are informational V1 guidance before the active timeline. They may include stable id/title/timing/details, an optional marker, and optional `ingredientUsage` for serving-sensitive preparation text.

Serving-aware advance prep remains informational from the planner's perspective. If advance work needs dependencies/resources/replanning, represent it as a real planner step rather than adding hidden schedule logic to `advancePrep`.

## Steps
A step may contain:
- stable `id` and optional owning `component`;
- title, collapsed summary and expanded details;
- optional `ingredientUsage` for serving-sensitive text;
- `durationMin`, or `durationRangeMin` + `durationPlanMin`;
- dependencies;
- resources;
- structured `woodfire` configuration;
- required `completion` criterion;
- optional `recheck`;
- optional `plan` semantics.

When both `durationRangeMin` and `durationPlanMin` are supplied, the planning duration must lie inside the declared range.

### Completion
Every executable step requires a completion object with a supported type and human-readable description.

Supported V1 contract types are:
- `manual`;
- `time`;
- `appearance`;
- `temperature`;
- `tenderness`;
- `checkpoint`;
- `combined`;
- `observation`.

The planned duration supports scheduling; the completion criterion remains authoritative during real cooking.

### Recheck
When a step declares `recheck.notReadyMin`, it must be a positive duration or positive `[min, max]` range.

The active-cook UI now promotes such steps into structured observation controls. V1 derives the user-facing choices from the existing completion type, completion description, recipe temperature target and recheck interval rather than adding a second observation-label schema.

A not-ready observation schedules a future recheck while leaving the step incomplete. A ready observation records the actual completion timestamp. This preserves the distinction between estimated duration and real cooking state, allowing Planner V1 buffers/dependencies to decide what downstream work actually moves.

See `sources/OBSERVATIONS_V1.md`.

## Dependencies
Supported relations:
- `after_finish`;
- `after_start`.

`lagMin` is a hard relationship. `planningBufferMin` is non-negative baseline margin that may be consumed by real delay before downstream work moves.

Dependency references must exist, self-dependencies are rejected and the graph must be acyclic.

For anchored recipes, every executable step must be in the prerequisite closure of at least one planning anchor. Disconnected orphan steps are invalid.

## Serving anchors and service milestone
The desired meal time is represented using:

```json
"plan": { "anchor": "serve" }
```

`anchorOffsetMin` may position other work relative to that target. Therefore `anchor: "serve"` means a temporal relationship, not necessarily that the step itself represents the meal being served.

The real journal/service milestone can be declared explicitly:

```json
"serviceStepId": "eat"
```

When provided, `serviceStepId` must reference a zero-offset `serve` anchor. Without it, the recipe must have exactly one zero-offset `serve` anchor so service remains unambiguous.

## Placement and legacy compatibility
Optional `plan.placement: "earliest"` pulls a dependency-connected step to its earliest feasible position. Default behavior is latest-feasible/backwards placement.

`preferredStartOffsetMin` remains accepted only for older recipe compatibility. New curated recipes should use anchors, dependencies, buffers and resources.

## Resources
Current vocabulary includes `woodfire`, `stovetop`, `fridge` and `passive`.

The validator accepts resource identifiers as data, while Planner V1 currently conflict-resolves `woodfire` as the exclusive resource. Other resources may run concurrently unless future semantics say otherwise.

## Woodfire configuration
Every Woodfire step must reserve `woodfire` and explicitly define:
- mode;
- numeric `temperatureC`;
- optional valid `temperatureRangeC` containing the setpoint;
- smoke on/off;
- pellets yes/no;
- support/accessory;
- covered/uncovered;
- optional placement guidance.

Critical appliance state must not live only in prose.

## Validation summary
`validateRecipe()` plus recipe-load ingredient-usage validation now reject at least:
- invalid serving bounds/timing ranges;
- invalid/contradictory temperature tracking metadata, malformed traceability ids or temperature completion without a target;
- duplicate ingredient/component/equipment/advance-prep/step ids;
- malformed scaling or incomplete step breakpoints;
- invalid/missing step or advance-prep ingredient-usage references and quantity tokens;
- unsafe usage unit overrides without explicit converted quantities;
- component/step ownership mismatches;
- malformed resources and durations;
- missing/invalid completion criteria;
- invalid recheck intervals;
- dependency reference/cycle/connectivity errors;
- invalid service milestone semantics;
- invalid Woodfire state/ranges;
- missing component ingredient/step references.

## Testing
The repository contains both reference-recipe tests and synthetic contract fixtures. In addition, the multi-recipe acceptance suite applies the executable contract automatically to every library entry marked `available`.

Available-recipe tests validate structured instruction usage, materialize advance-prep reminders and build schedules at minimum/reference/maximum servings with no unresolved quantity tokens. Pork Belly additionally has explicit 2/4/6/8-serving Active Cook text regression coverage; turkey has 4/5/6 gratin coverage; barbacoa covers 6/8 advance-prep and Active Cook quantities.

Observation tests cover label derivation, scheduled rechecks, actual completion and persistence helpers for both tenderness-driven Pork Belly and temperature-driven turkey.

The deterministic planner stress matrix executes every current integer serving count across all available recipes, baseline schedules, 1/5/15/30/60/120 min actual-start, actual-completion and expected-completion delays, plus progressively frozen historical prefixes. The current manifest yields 22,672 scenarios. Fixed historical contradictions are retained as facts; every remaining movable dependency and Woodfire constraint must still be resolved.

See `sources/MULTI_RECIPE_CONTRACT.md`, `sources/STEP_INGREDIENT_USAGE_V1.md` and `sources/OBSERVATIONS_V1.md`.

## Next schema work
1. Pass serving/configuration context into the planner for capacity/batch-dependent timing.
2. Add a flexible planning-window concept when a real recipe requires it.
3. Add curated observation labels only if a real recipe cannot be represented clearly by V1-derived controls.
4. Add richer resources such as user attention only when real meal plans demonstrate the need.
5. Consider optional validation/aggregation between top-level shopping quantities and structured instruction usage only after real recipes demonstrate a reliable rule for optional/shared ingredients.
