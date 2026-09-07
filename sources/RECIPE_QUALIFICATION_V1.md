# Cooking Companion — Recipe Qualification V1

## Purpose
Recipe executability and culinary maturity are separate concerns.

`recipes/index.json` therefore carries two independent fields:
- `status` — whether the application can execute the recipe;
- `qualification` — how much real-cook evidence exists behind the current recipe version/process.

Passing schema/planner/offline tests is necessary for an executable recipe but does not prove taste, timing realism or practical usability on a real Ninja Woodfire cook.

## Availability
Current values:
- `available` — complete executable content that passes the generic application contract;
- `coming_soon` — visible library content that is not yet executable product content.

`available` must never be interpreted as culinary validation.

## Qualification levels
Every `available` recipe must declare one of:

### `untested`
The recipe is technically executable and passes automated validation, but the current recipe/process has not yet been qualified by a representative real cook.

UI label: `À tester`.

### `test_cooked`
The meal or a sufficiently representative version has been cooked in reality and provides a practical baseline, but the current content has not yet completed a documented feedback/refinement loop strong enough to call it validated.

UI label: `Testée`.

### `validated`
The recipe has at least one representative real cook plus documented feedback that has been incorporated or explicitly reviewed against the current content. Validation is version/process evidence, not a guarantee that all appliances, ingredient sizes or conditions will behave identically.

UI label: `Validée`.

## Current classification baseline — 2026-09-01
- Pork Belly Burnt Ends: `validated`. The first real cook generated explicit refinement to cube size and uncovered finishing duration, incorporated into later content versions.
- Roulé de dinde + gratin de courgettes: `test_cooked`. The recipe is reconstructed from the real meal cooked/discussed on 2026-08-26/28 and uses first-cook baselines.
- Tacos barbacoa de bœuf fumée: `test_cooked`. The source records it as a real meal promoted into the shared planner pipeline, but no comparable documented refinement loop is yet recorded.
- Porc coréen effiloché au Woodfire: `test_cooked`. A representative real cook exists; the recipe remains below `validated` until its feedback/refinement loop is documented against the current content.
- All recipes introduced in the 2026-08-31 planner-pattern and second expansion waves: `untested` until a representative cook is recorded.
- Poulet miel–sésame–gingembre, udon & légumes sautés: `test_cooked`, cooked successfully in a wok on 2026-09-07. Confirmed: sot-l’y-laisse works well; the clean-glaze/raw-marinade split matters; lightly seasoned udon preserve the balance; vegetables remain crisp; overall result was very good. One successful cook is not yet `validated`.

Do not silently promote a qualification level based only on automated tests or on the fact that a recipe is marked `available`.

## Promotion rule
A qualification change should be a small content/source change with evidence in either:
- a recipe-specific source document;
- a cook-journal record/feedback summary that is intentionally promoted into repo documentation;
- another explicit project record describing the real cook and resulting review.

A typical path is:

`untested → test_cooked → validated`

A recipe may remain `test_cooked` for multiple cooks if the evidence is incomplete or feedback has not yet been reconciled.

## Regression / downgrade
If a materially changed recipe version invalidates prior process evidence, downgrade qualification when appropriate. Examples:
- major ingredient/process rewrite;
- materially different cut/geometry;
- changed Woodfire mode sequence;
- changed serving range requiring different batch behavior.

Minor wording, UI or quantity-materialization fixes do not automatically invalidate qualification.

## Product behavior
The library should expose qualification without blocking execution:
- `À tester` recipes remain tappable because `status: available` means technically executable;
- the recipe detail should show the same qualification meaning;
- qualification must not alter planner/session behavior.

The Cook Journal remains the preferred place to capture raw real-cook observations. Curated recipe/source updates turn that evidence into durable product knowledge.
