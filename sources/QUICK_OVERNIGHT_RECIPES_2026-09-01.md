# Cooking Companion — Quick overnight-prep recipe batch (2026-09-01)

## Purpose
Add a small group of weekday-friendly complete meals where the main flavor/prep work happens the night before and the next-day active cook stays short.

All four recipes are executable through Recipe Schema V1 / Planner V1 and enter the library with `qualification: untested`. Real-cook feedback remains authoritative and should be captured in Cook Journal before durable changes are promoted into the recipe content or qualification.

This batch does **not** extend planner semantics. `advancePrep` remains informational pre-cook guidance; the next-day executable work is scheduled backwards from the requested serving time.

## Recipes

### Poulet gochujang miel-soja, riz jasmin & concombre au sésame
- reference: 4 servings; supported: 2–6;
- overnight prep: 8–18 h chicken marinade;
- next-day Woodfire: GRILL 210 °C, smoke OFF, pellets no, grill surface, uncovered;
- planned chicken cook: 15 min inside a 12–18 min window;
- completion: 74 °C core temperature in the thickest piece;
- sides: jasmine rice + chilled sesame cucumber in parallel.

### Bavette bulgogi express, udon au sésame & concombre-carotte
- reference: 4 servings; supported: 2–4 to preserve a genuine one-layer fast sear;
- overnight prep: 8–18 h thin-sliced beef marinade;
- next-day Woodfire: GRILL 230 °C, smoke OFF, pellets no, grill surface, uncovered;
- planned beef cook: 10 min inside an 8–12 min window;
- completion: uniformly seared plus at least 63 °C on the thickest reliably measurable strip;
- explicit 3 min post-cook rest;
- sides: udon + chilled cucumber/carrot salad.

### Filet mignon érable-moutarde-soja, couscous citronné & haricots verts
- reference: 4 servings; supported: 2–4;
- overnight prep: 8–18 h pork marinade;
- next-day Woodfire: AIR FRY 200 °C, smoke OFF, pellets no, Air Fry basket, uncovered;
- planned pork cook: 22 min inside an 18–25 min window;
- glaze only with a clean reserved mixture near the end;
- completion: at least 63 °C core temperature;
- explicit 3 min post-cook rest;
- sides: lemon couscous + green beans in parallel.

### Saumon miso-miel, soba au sésame & pak choï
- reference: 4 servings; supported: 2–4;
- overnight prep: 6–12 h miso/honey/soy marinade, deliberately without citrus overnight;
- next-day Woodfire: BAKE/ROAST 200 °C, smoke OFF, pellets no, grill surface, uncovered;
- planned salmon cook: 13 min inside a 10–16 min window;
- completion: 63 °C core temperature in the thickest fillet;
- sides: sesame soba + sautéed pak choi.

## Serving-aware advance preparation
Each night-before marinade uses `advancePrep.ingredientUsage` and `{{use:...}}` tokens. The selected serving count therefore changes both the shopping list and the advance-prep quantities before the cook starts.

Raw marinade that contacted meat/fish is not reused as finishing sauce. Where a glaze is needed, the recipe builds a separate clean mixture from the reserved top-level ingredients.

## Food-safety baseline
Current minimum-temperature guidance was checked against FoodSafety.gov before encoding this batch:
- poultry: 165 °F / 74 °C;
- beef/pork steaks, chops and roasts: 145 °F / 63 °C with at least 3 min rest;
- fish: 145 °F / 63 °C.

References:
- https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures
- https://www.foodsafety.gov/blog/how-grill-safely-summer

The temperature/state criterion is authoritative; the declared minute windows are planning estimates and should be refined from real Woodfire cooks.

## Qualification plan
These recipes intentionally ship as `untested` so the product can be used in real conditions rather than waiting for laboratory-style pre-qualification.

For each real cook, capture at least:
- actual start/service times;
- temperature/observations where relevant;
- whether the planned window was credible;
- whether the side timing felt natural;
- taste/sauce balance;
- portion/capacity observations;
- rating + `Notes pour la prochaine fois` in Cook Journal.

A representative successful cook can promote a recipe to `test_cooked`; `validated` should still require a documented refinement/confirmation loop rather than one technically successful execution.

## Deliberate non-goals
- no new planner algorithm;
- no automatic batching from servings;
- no non-Woodfire resource conflict solver;
- no reusable external component extraction;
- no predictive ETA;
- no claim that the first-cook timings are already culinarily validated.
