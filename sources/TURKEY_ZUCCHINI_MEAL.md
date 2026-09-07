# Cooking Companion — Roulé de dinde + gratin de courgettes

## Status
Second executable reference meal, reconstructed from the meal cooked/discussed on 2026-08-26/28 and encoded as `recipes/sweet-savory-turkey-zucchini-gratin.json`, content version 3.

This source records the culinary intent and reference timeline. The executable JSON remains the machine-readable source of truth.

## Meal
- Main: roulé de dinde, approximately 1.0 kg.
- Side: creamy zucchini gratin.
- Reference servings: 5; supported range 4–6 using the same execution structure.
- Desired profile: sweet-savory, soy/honey/smoked-paprika/mustard; no thyme.
- Woodfire and conventional oven run in parallel.

## Turkey marinade
External marinade for the 1 kg turkey:
- 20 g soy sauce;
- 25 g honey;
- 15 g oil;
- 10 g mustard;
- 10–15 g cider vinegar;
- 6–7 g smoked paprika;
- 2 garlic cloves;
- approximately 1/2 tsp black pepper;
- no added salt because of the soy sauce.

These turkey quantities are intentionally fixed across the supported 4–6-serving range because the recipe uses the same approximately 1 kg roulé. They must not be linearly increased merely because the side-dish serving count changes.

### Optional injection
Approximate 60 mL injection mixture:
- 25 g soy sauce;
- 25 g water or apple juice;
- 8 g honey;
- 2–3 g cider vinegar.

Filter finely and cool before injecting in several small points. Injection is optional and must never become a mandatory execution step. Like the external marinade, this quantity is intentionally fixed for the declared roulé size.

## Turkey execution
Reference appliance sequence:
1. `SMOKER`, 125 °C nominal (120–130 °C acceptable), smoke ON, pellets, directly on the grill surface, uncovered, about 25 min.
2. Transfer to a compact Woodfire-safe roasting dish.
3. Add 50–100 mL water or poultry broth to the bottom of the dish. Do not use raw leftover marinade.
4. `BAKE/ROAST`, 170 °C, smoke OFF, uncovered.
5. Apply a thin glaze made from marinade reserved before raw-meat contact.
6. Continue until 74 °C at the centre of the roulé; time is secondary to the probe reading.
7. Rest 10 min. Foil, if used, is only a very loose tent during rest; the turkey is not cooked covered.

### Food-safety basis for 74 °C
FoodSafety.gov and USDA FSIS state a safe minimum internal temperature of 165 °F / 74 °C for turkey/poultry measured with a food thermometer.

References checked 2026-08-29:
- https://www.foodsafety.gov/food-safety-charts/meat-poultry-charts
- https://ask.fsis.usda.gov/article/What-is-a-safe-internal-temperature-for-cooking-turkey-parts

## Zucchini gratin
Reference recipe for approximately 5 people:
- 1.2 kg zucchini;
- 300 mL full-fat cream;
- 3 eggs;
- 2 garlic cloves;
- 100 g grated cheese (Comté, Emmental or Gruyère);
- 30 g Parmesan optional;
- approximately 1 tbsp olive oil;
- approximately 8 g salt total: about 5 g to drain the zucchini + about 3 g in the cream/egg mixture, then adjust for cheese saltiness;
- approximately 1/2 tsp black pepper in the gratin;
- approximately 1/4 tsp nutmeg optional.

These are first-cook baselines rather than immutable seasoning limits. The structured recipe scales the gratin quantities across 4–6 servings where appropriate.

### V3 serving-aware active-cook quantities
Content V3 removes the old hard-coded `Pour 5 personnes` instruction from the active-cook step. `prep-gratin` now uses structured `ingredientUsage` so the selected serving count produces the actual quantities shown during cooking.

Examples:
- 4 servings: 960 g zucchini, 240 mL cream, 3 eggs, 2 garlic cloves, 80 g grated cheese, approximately 4 g draining salt + 2.4 g mixture salt;
- 5 servings: 1.2 kg zucchini, 300 mL cream, 3 eggs, 2 garlic cloves, 100 g grated cheese, approximately 5 g + 3 g salt;
- 6 servings: 1.44 kg zucchini, 360 mL cream, 4 eggs, 3 garlic cloves, 120 g grated cheese, approximately 6 g + 3.6 g salt.

Pepper and optional nutmeg remain fixed at the recipe baseline. The turkey/marinade chain also remains fixed because the declared meat item itself is fixed at about 1 kg.

Preparation pattern:
- slice zucchini thinly;
- use the serving-scaled draining salt and drain 15–20 min, then drain thoroughly;
- combine cream, eggs, garlic, serving-scaled mixture salt, pepper and optional nutmeg;
- lightly oil the gratin dish;
- assemble and top with cheese;
- bake uncovered in a fan oven around 180–185 °C until the centre is set, zucchini tender and top browned;
- allow a short rest before service.

## Reference service timeline — 20:30 meal
- 16:45 — prepare marinade / optional injection mixture.
- 16:50 — inject if desired, coat turkey and refrigerate.
- 18:35 — remove turkey from refrigerator.
- 18:40 — start zucchini-gratin preparation.
- 18:45 — preheat Woodfire in SMOKER at 125 °C.
- 19:00 — smoke turkey uncovered on grill.
- 19:25 — transfer turkey to roasting dish at 170 °C; gratin enters oven in parallel.
- 20:05 — glaze turkey.
- 20:15 — gratin out, begin rest.
- approximately 20:20 — turkey reaches 74 °C; remove and rest 10 min.
- 20:30 — serve.

V3 changes instructional quantities only; the reference timeline is unchanged.

The turkey endpoint is state-driven. If 74 °C has not been reached on schedule, service moves rather than terminating the cook early.

## Architecture value
This meal is intentionally different from the Pork Belly reference:
- core-temperature completion is decisive;
- the cook is much shorter;
- Woodfire phases remain uncovered;
- a conventional oven runs in parallel as another declared resource;
- optional injection is advance/prep guidance rather than a separate required recipe variant;
- one meal has two independent chains converging on a common service step;
- the main can use fixed quantities while the side scales across serving count, demonstrating that scaling policy belongs to ingredient/use semantics rather than a global multiplier.

It therefore acts as the first real multi-recipe architecture test rather than another variation of the original long-cook workflow.
