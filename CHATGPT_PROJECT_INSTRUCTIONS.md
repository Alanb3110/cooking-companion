# Cooking Companion — ChatGPT Project Instructions

Use this as the compact instruction set for work on Cooking Companion. Detailed product, technical and cooking contracts live in `sources/` and are the source of truth. Before significant changes, read the relevant sources **and current GitHub state**; do not infer current implementation from an older roadmap.

## Goal
Cooking Companion is a mobile-first, multi-equipment cooking copilot, not primarily a recipe viewer. The Ninja Woodfire remains first-class, but no recipe is required to use it: support Woodfire-only, non-Woodfire and mixed-equipment meals.

Canonical flow:
**illustrated recipe library → servings + desired meal time → scaled ingredients/shopping + prep → generated full-meal plan → active cooking assistant → cook journal**.

The core differentiator is orchestration: transform structured recipe data into an executable schedule for the whole meal, including main, sides, sauces, stovetop work, resting, chilling, plating and advance preparation.

## Product rules
- Primary device: installed iPhone/PWA; desktop is secondary.
- Preserve GitHub Pages compatibility and offline operation.
- Favor 1–3 tap interactions during cooking.
- Each timed task has a clear collapsed summary and expandable detail.
- Every Woodfire step explicitly states mode, °C setpoint, smoke on/off, pellets, support/accessory, covered/uncovered and placement when relevant.
- Plan around desired serving time.
- Treat durations as estimates where cooking state matters; temperature/tenderness/appearance criteria override the clock when appropriate.
- Actual starts/completions are historical facts. Delays/rechecks propagate through dependencies; do not blindly shift unrelated work.
- Support parallel tasks. The Woodfire is currently the only automatically conflict-resolved exclusive resource; declare other resources accurately and use dependencies until a demonstrated need justifies broader conflict solving.
- Never sacrifice food quality solely to preserve the planned clock.

## Recipe availability vs qualification
`recipes/index.json` separates:
- `status` — whether content is executable (`available` / `coming_soon`);
- `qualification` — real-cook maturity for available recipes:
  - `untested` — technically executable, representative real cook still required;
  - `test_cooked` — real-cooked practical baseline exists;
  - `validated` — real-cook feedback has been documented and reviewed/incorporated.

Automated tests can justify `available`; they cannot by themselves justify culinary qualification. See `sources/RECIPE_QUALIFICATION_V1.md`.

Prefer qualifying the current diverse library through real cooks before adding recipes simply to increase count.

## Current implementation
This is no longer the original one-meal POC.

Current merged product includes:
- a manifest-driven illustrated library where every `available` meal is executable through the generic app pipeline;
- serving selection, scaled ingredients and shopping/prep;
- dependency-aware serving-time planner with buffers and Woodfire conflict resolution;
- actual starts/completions, +5/+10/+15 next-action delays and observation rechecks;
- DOM-free `active-cook-controller.js` orchestration;
- optional fast manual temperature tracking;
- versioned active sessions with frozen recipe snapshots;
- local Cook Journal with rating/notes and JSON backup/restore;
- conservative service-worker updates that do not force a new generation over an open cook;
- CI acceptance for every `available` recipe.

Pork Belly is the validated reference after a real-cook refinement loop. Turkey/gratin and barbacoa are real-cooked baselines. Every other currently `available` meal remains technically executable but unqualified until a representative real cook is recorded.

## Architecture
Maintain separate conceptual layers:
1. recipe/content data;
2. pure/testable planner (`planner.js`, recipe-facing `meal-planner.js`);
3. session/persistence/orchestration (`session.js`, `active-cook-controller.js`, observations/journal);
4. UI rendering/interactions (`app.js` + UI modules).

Do not put recipe-specific timing/quantity rules back into `app.js`.

Prefer vanilla HTML/CSS/JS while manageable. Do not add a backend, accounts, paid APIs, runtime AI, framework or hardware integration without a demonstrated product need.

## Active-cook UX priority
1. next action + countdown;
2. current active action;
3. current appliance configuration, including detailed Woodfire configuration when relevant;
4. completion/observation control;
5. rapid temperature entry when enabled;
6. detailed instructions on demand;
7. upcoming steps.

Manual temperature logging remains: value → Add/Enter → automatic timestamp.

## Recipe/content rules
- Metric units by default.
- Define reference/min/max servings and explicit scaling semantics; not every quantity scales linearly.
- Use structured `step.ingredientUsage` where active-cook quantities depend on servings.
- Separate preparation, cooking, resting, finishing and service.
- Use sensory/tenderness criteria when time/temperature alone is insufficient.
- Keep placement, spacing, covering and liquid-level instructions explicit where relevant.
- Verify safety-critical temperature/storage rules against current authoritative sources before encoding them; current executable temperature targets resolve through `temperature.guidanceId` and `sources/FOOD_SAFETY_TRACEABILITY_V1.md`.

Known household defaults: generous sauces; sweet-savoury welcome; thyme generally avoided; avoid alcohol/flambé unless explicitly requested.

## Development workflow
- Start meaningful work from current `main` on a focused branch/PR.
- Keep planner refactors, visual redesigns and recipe-content waves separate when possible.
- Add/update automated tests for behavior/contracts changed.
- Preserve local data via migrations where practical.
- Preserve recipe snapshots for active cooks.
- Update source docs whenever product semantics, recipe/schema/planner/storage behavior changes.
- Test meaningful UX/PWA changes on installed iPhone/Safari; Node/static tests do not replace that qualification.
- Keep storage-fault preservation, the deterministic planner stress matrix and the Mobile WebKit smoke path green.
- Use `sources/IPHONE_PWA_QUALIFICATION_V1.md` for physical-device release evidence.

## Current priorities
1. Keep README/source contracts synchronized with merged code.
2. Run representative real-cook qualifications across distinct planner patterns: fast temperature/parallel meal, genuine Woodfire conflict, long tenderness/recheck meal.
3. Feed journal observations back into recipe versions and qualification.
4. Complete stale-branch cleanup and protect `main` with CI if repository settings allow it.
5. Extend flexible windows, non-Woodfire conflict solving, reusable components or batching only when real meals prove the need: **real cooks → observations → demonstrated need → product evolution**.
6. Continue small `app.js` extractions only when ownership becomes materially unclear; do not refactor for aesthetics alone.
7. Defer predictive ETA until enough clean history exists to expose honest uncertainty.

When a choice is ambiguous, optimize for a real cook in progress: minimal cognitive load, explicit appliance state, robust timing and easy recovery from delays.
