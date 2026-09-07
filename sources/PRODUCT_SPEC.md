# Cooking Companion — Product Source

## Purpose
This file is the current product source of truth for Cooking Companion.

## Product definition
Cooking Companion is an illustrated recipe library plus a multi-equipment meal-execution engine. The Ninja Woodfire is a first-class appliance, not a mandatory one: recipes may use a wok, pan, saucepan, oven, fridge and passive preparation, independently or alongside Woodfire work.

The user chooses what to cook; the application converts that choice into scaled ingredients/shopping, advance preparation, a resource-aware schedule and a low-friction active-cooking interface.

The key product idea is:

**Do not merely explain the recipe. Operationalize the entire meal.**

## Canonical user flow
1. Browse an illustrated recipe/meal library.
2. See whether a recipe is technically executable and how far it has been qualified by real cooking.
3. Open a recipe and review meal composition, timing, difficulty and expected result.
4. Choose servings.
5. Choose desired serving time.
6. Review generated:
   - scaled ingredients;
   - categorized shopping checklist;
   - advance-prep reminders;
   - equipment/accessory requirements;
   - planner-derived recommended start.
7. Start cooking.
8. Follow time-stamped cards with concise summaries and expandable detail.
9. Start/finish real phases, record observations/rechecks and log temperatures with minimal interaction.
10. Let actual progress adjust unfinished dependent work when required.
11. Serve the meal and retain the session in the local Cook Journal.
12. Feed useful real-cook findings back into curated recipe revisions and qualification.

## Current product maturity
The reusable V1 foundation is implemented rather than aspirational.

Current merged capabilities include:
- illustrated manifest-driven multi-recipe library;
- every `available` meal declared in `recipes/index.json` is executable through the generic app pipeline;
- servings and serving-time configuration;
- ingredient scaling and categorized shopping/prep;
- planner-derived recommended start time;
- dependency-aware serving-time planning;
- planning buffers and Woodfire exclusive-resource conflict resolution;
- active-cook `upcoming / active / done` lifecycle with separate actual starts/completions;
- observation-driven rechecks;
- dependency-aware replanning from runtime facts;
- optional fast temperature tracking;
- versioned local active sessions with frozen recipe snapshots;
- local Cook Journal with rating/notes and JSON backup/restore;
- offline PWA behavior and conservative service-worker updates;
- generic CI acceptance for every executable recipe;
- deterministic all-library planner stress coverage, local-storage failure preservation and a Mobile WebKit critical-flow smoke test.

The main remaining product risk is **real-cook qualification and field usability**, not construction of the basic planner.

## Library experience
Recipe cards are visual and easy to scan.

Useful metadata includes:
- local hero image;
- title/description;
- reference/supported servings;
- active-prep and elapsed-time estimates;
- difficulty;
- major Woodfire modes;
- food/method tags;
- real-cook qualification.

Quality and executable planning remain more important than recipe count.

## Availability vs culinary qualification
`recipes/index.json` separates two concepts.

### Availability
- `available` — complete technical content that can execute through the generic app pipeline;
- `coming_soon` — visible but not yet executable product content.

### Qualification
Every `available` recipe carries:
- `untested` — schema/planner/offline-valid, representative real cook still required;
- `test_cooked` — a real-cooked practical baseline exists;
- `validated` — documented real-cook feedback has been reviewed/incorporated into current content/process.

Automated tests can prove technical executability; they cannot prove taste, real timing, ingredient variability or cook ergonomics.

Current baseline:
- Pork Belly Burnt Ends — `validated`;
- turkey + zucchini gratin — `test_cooked`;
- smoked beef barbacoa — `test_cooked`;
- every other currently `available` meal — `untested` until representative real cooks are recorded.

See `sources/RECIPE_QUALIFICATION_V1.md`.

## Meal composition
A meal contains embedded logical components such as:
- main;
- side;
- sauce;
- garnish/finishing component.

Components are currently grouping semantics inside one meal JSON. They may become reusable/swappable only when multiple real meals demonstrate a useful reuse pattern. Do not over-engineer modularity prematurely.

## Scaling and configuration
Current user inputs:
- servings within the recipe's declared supported range;
- desired serving time.

Ingredient scaling uses explicit rules. Not everything scales linearly: meat geometry, cooking vessels, pellet quantities, minimum sauce volumes, eggs/lemons and batch capacity may require fixed, step or range semantics.

Serving-sensitive quantities used inside active-cook prose are materialized from structured step ingredient usage rather than being hard-coded at reference servings.

Planner V1 does not create extra batches or automatically alter durations from serving count. Therefore each advertised serving range must remain credible with one declared execution structure.

## Shopping and pre-cook
For the selected recipe/servings, the pre-cook view provides:
- scaled categorized ingredients;
- checkboxes;
- optional-item markers;
- recipe-specific consumables such as pellets where relevant;
- advance-prep reminders;
- equipment/accessory requirements;
- planner-derived recommended start.

Shopping state is version-scoped so a changed recipe does not silently inherit stale checks from an older content version.

Pantry/staple memory remains a later enhancement rather than an MVP requirement.

## Planning engine
The operational schedule is generated from structured constraints, not a fixed list of negative offsets.

Planner inputs include:
- desired serving timestamp;
- step duration/range;
- dependencies/lags;
- planning buffers;
- resource reservations;
- explicit user delays;
- actual start timestamps;
- actual completion timestamps;
- expected completion from pending observation rechecks.

The planner works primarily backwards from service while respecting prerequisites and Woodfire conflicts.

### Resources
The Woodfire is currently the only automatically conflict-resolved exclusive resource.

Other declared resources such as:
- oven;
- stovetop;
- fridge;
- passive rest/work
may run concurrently but are not generally conflict-solved yet.

Only extend this model when a real meal demonstrates a shared-resource collision that materially harms the plan.

### Parallelism
Useful parallel work is intentional:
- sauce during meat cooking;
- stovetop work during Woodfire phases;
- passive rest while another task finishes;
- independent branches that converge on service.

### Delay propagation
Actual facts remain fixed. Replanning moves only work that is still movable and constrained by what actually happened.

Examples:
- a sauce that is late but still finishes before service need not move the meat;
- an unexpectedly long tenderness phase may move finishing/rest and competing Woodfire work;
- completed steps retain their actual timestamps;
- buffers absorb limited uncertainty before service time slips.

## Active-cooking UI
Collapsed step cards communicate at a glance:
- planned time/recheck time;
- action;
- concise summary;
- status;
- critical Woodfire state where relevant.

Expanded detail may include:
- serving-materialized quantities;
- exact method;
- support/accessory and placement;
- covering/liquid instructions;
- temperature target;
- appearance/tenderness cues;
- observation/recheck controls;
- actual start/completion timestamps.

During a cook the UI priority is:
1. next action + countdown;
2. current action;
3. current Woodfire configuration;
4. completion/observation control;
5. rapid temperature entry when enabled;
6. expanded details;
7. subsequent steps.

## Observation-driven cooking
Observation/recheck behavior is implemented.

Some phases must not be represented as fixed-duration timers only. Practical choices may include:
- `Encore ferme`;
- `Presque prêt`;
- `Très tendre`;
- equivalent temperature/checkpoint states.

A not-ready result can schedule another check without completing the step. That expected completion time is fed into the planner, which consumes available buffer before moving dependent work/service.

A ready result records actual completion.

## Temperature tracking
Temperature logging is optional per recipe.

Target interaction remains:
1. enter value;
2. Add/Enter;
3. automatic timestamp.

Supported UI includes:
- target temperature;
- graph;
- recent samples;
- undo/new-series;
- CSV export.

A measurement does not automatically complete a step; the cook confirms the relevant completion/observation state.

No ETA is currently inferred from temperature slope. Future prediction may use temperature/history only with realistic uncertainty.

Every current executable temperature target carries a stable traceability id. `sources/FOOD_SAFETY_TRACEABILITY_V1.md` records the value, recipe coverage, jurisdiction, authoritative source and known limits, while keeping collagen/tenderness targets distinct from minimum safety rules.

## Cook Journal
Completed real sessions are stored locally with recipe/version, servings, target/actual service, schedule, actual starts/completions, observations, delays and temperature samples.

The journal also supports:
- rating;
- `Notes pour la prochaine fois`;
- local versioned JSON backup/restore.

DEV/test sessions do not pollute real history.

If session or journal storage is unavailable, full, corrupt or from a future schema, the application surfaces an actionable warning. Existing unreadable/future data is preserved byte-for-byte instead of being silently replaced by defaults.

The journal is the preferred place to capture raw real-cook evidence. Durable findings should then become recipe/source revisions rather than remaining trapped in one local note.

## Recipe acquisition strategy
Hybrid model:
- curated base recipes committed to the repo;
- recipes added progressively as structured JSON;
- compatible content may be authored externally/with ChatGPT then validated and committed.

Runtime AI is not required and must not be a dependency of recipe execution.

Prefer qualifying the current diverse library before adding recipes simply to increase count. A new recipe is most useful when it fills a real meal need or exposes a planning limitation not covered by existing content.

## Reference platform and constraints
- Primary device: installed iPhone/Safari PWA.
- Distribution: GitHub Pages.
- Core application: static/client-side.
- Offline operation required once assets are cached.
- Local-first persistence.
- No accounts/backend required.

Service-worker updates must not force a new app generation over an already-open long cook.

Physical installed-iPhone qualification follows `sources/IPHONE_PWA_QUALIFICATION_V1.md`; Mobile WebKit automation is a prerequisite, not a substitute for screen-lock, suspension, offline/update and real-cook evidence.

## Product roadmap from current state
### Current stabilization / qualification phase
- keep documentation synchronized with merged code;
- keep the planner stress matrix, persistence fault tests, safety traceability and Mobile WebKit smoke path green;
- run representative real cooks across distinct planner patterns;
- refine recipes from journal evidence;
- expose qualification clearly;
- periodically validate installed-iPhone PWA/offline/update behavior;
- keep repository integration hygiene strong.

### Next capabilities only when evidence requires them
- flexible planning windows;
- broader shared-resource conflict solving;
- reusable external components;
- batching/capacity synthesis from servings;
- stronger history-derived recommendations.

### Later
- temperature/history ETA with explicit uncertainty;
- pantry intelligence;
- optional probe/hardware integration;
- broader appliance generalization after Woodfire workflow is mature.

## Success criteria
During a real meal:
- the user rarely needs to reopen an external recipe;
- shopping/prep is obvious before cooking;
- the next action is obvious during cooking;
- Woodfire configuration is never ambiguous;
- sides/sauces arrive at the right time without mental scheduling;
- delays/rechecks are absorbed rationally;
- actual history remains trustworthy;
- temperature logging is faster than using Notes;
- the final meal stays close to the selected serving time without compromising doneness;
- real-cook feedback can be converted into a better next recipe version.
